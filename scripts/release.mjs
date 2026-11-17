import { execSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipPush = args.includes('--skip-push');
const bumpArg = args.find((a) => !a.startsWith('--')) ?? 'patch';

function logStep(title) {
  console.log(`\n=== ${title} ===`);
}

function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  if (isDryRun) return;
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...options });
}

function runArgs(bin, binArgs, options = {}) {
  console.log(`> ${bin} ${binArgs.join(' ')}`);
  if (isDryRun) return;
  const res = spawnSync(bin, binArgs, { stdio: 'inherit', cwd: ROOT, ...options });
  if (res.status !== 0) {
    throw new Error(`Command failed (${res.status}): ${bin} ${binArgs.join(' ')}`);
  }
}

function loadEnvRelease() {
  const envPath = path.join(ROOT, '.env.release');
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    out[key] = val;
  }
  return out;
}

function computeNextVersion(current, kind) {
  if (/^\d+\.\d+\.\d+$/.test(kind)) {
    return kind;
  }
  const [maj, min, pat] = current.split('.').map((n) => Number.parseInt(n, 10));
  if (kind === 'major') return `${maj + 1}.0.0`;
  if (kind === 'minor') return `${maj}.${min + 1}.0`;
  if (kind === 'patch') return `${maj}.${min}.${pat + 1}`;
  throw new Error(`Invalid version bump argument: ${kind}. Use patch | minor | major | X.Y.Z`);
}

function syncNativeVersions(nextVersion, nextCode) {
  // Android Gradle
  const gradlePath = path.join(ROOT, 'android', 'app', 'build.gradle');
  if (existsSync(gradlePath)) {
    let gradle = readFileSync(gradlePath, 'utf8');
    gradle = gradle
      .replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
      .replace(/versionName\s+"[^"]+"/, `versionName "${nextVersion}"`);
    if (!isDryRun) writeFileSync(gradlePath, gradle, 'utf8');
    console.log(`Synced Android build.gradle -> ${nextVersion} (${nextCode})`);
  }

  // iOS Xcode project.pbxproj
  const pbxPath = path.join(ROOT, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
  if (existsSync(pbxPath)) {
    let pbx = readFileSync(pbxPath, 'utf8');
    pbx = pbx
      .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${nextVersion};`)
      .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${nextCode};`);
    if (!isDryRun) writeFileSync(pbxPath, pbx, 'utf8');
    console.log(`Synced iOS project.pbxproj -> ${nextVersion} (${nextCode})`);
  }

  // Tauri config
  const tauriPath = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
  if (existsSync(tauriPath)) {
    const tauri = JSON.parse(readFileSync(tauriPath, 'utf8'));
    tauri.version = nextVersion;
    if (!isDryRun) writeFileSync(tauriPath, `${JSON.stringify(tauri, null, 2)}\n`, 'utf8');
    console.log(`Synced Tauri tauri.conf.json -> ${nextVersion}`);
  }
}

function main() {
  const env = { ...loadEnvRelease(), ...process.env };
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

  const currentVersion = pkg.version;
  const currentCode = Number(pkg.versionCode ?? 1);
  const nextVersion = computeNextVersion(currentVersion, bumpArg);
  const nextCode = currentCode + 1;
  const tagName = `v${nextVersion}`;

  logStep(`1. Version Bump: ${currentVersion} (${currentCode}) -> ${nextVersion} (${nextCode})`);
  pkg.version = nextVersion;
  pkg.versionCode = nextCode;
  if (!isDryRun) {
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  }
  syncNativeVersions(nextVersion, nextCode);

  logStep('2. Quality Gate (Vitest + TypeScript + Vite Build)');
  run('npm test');
  run('npm run build');

  logStep(`3. Git Commit & Tag (${tagName})`);
  run('git add package.json');
  if (existsSync(path.join(ROOT, 'android', 'app', 'build.gradle'))) {
    run('git add android/app/build.gradle');
  }
  if (existsSync(path.join(ROOT, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj'))) {
    run('git add ios/App/App.xcodeproj/project.pbxproj');
  }
  if (existsSync(path.join(ROOT, 'src-tauri', 'tauri.conf.json'))) {
    run('git add src-tauri/tauri.conf.json');
  }
  runArgs('git', ['commit', '-m', `chore(release): ${tagName} (build ${nextCode})`]);
  runArgs('git', ['tag', '-a', tagName, '-m', `Release ${tagName} (build ${nextCode})`]);
  if (!skipPush) {
    run('git push');
    run('git push --tags');
  } else {
    console.log('Skipping git push (--skip-push).');
  }

  const releaseOutDir = path.join(ROOT, 'releases', tagName);
  if (!isDryRun) mkdirSync(releaseOutDir, { recursive: true });

  logStep('4. Web Deploy (zorbit.truncgil.com)');
  if (env.DEPLOY_SSH_HOST && env.DEPLOY_WEB_DIR) {
    run(`ssh ${env.DEPLOY_SSH_HOST} "mkdir -p ${env.DEPLOY_WEB_DIR}"`);
    run(`scp -r dist/* ${env.DEPLOY_SSH_HOST}:${env.DEPLOY_WEB_DIR}/`);
  } else {
    console.log('Skipped: DEPLOY_SSH_HOST / DEPLOY_WEB_DIR not set in .env.release');
  }

  logStep('5. Android Google Play (.aab)');
  if (existsSync(path.join(ROOT, 'android'))) {
    run('npx cap sync android');
    run('gradlew.bat bundleRelease', { cwd: path.join(ROOT, 'android') });
    const aabSrc = path.join(
      ROOT,
      'android',
      'app',
      'build',
      'outputs',
      'bundle',
      'release',
      'app-release.aab'
    );
    const aabDest = path.join(releaseOutDir, `zorbit-${tagName}-build${nextCode}.aab`);
    if (!isDryRun && existsSync(aabSrc)) {
      copyFileSync(aabSrc, aabDest);
      console.log(`AAB ready: ${aabDest}`);
    }
  } else {
    console.log('Skipped: android/ folder not initialized yet (run: npx cap add android)');
  }

  logStep('6. Windows Microsoft Store (.msix)');
  if (env.WINDOWS_MSIX_CMD) {
    run(env.WINDOWS_MSIX_CMD);
    if (env.WINDOWS_MSIX_OUTPUT && !isDryRun && existsSync(env.WINDOWS_MSIX_OUTPUT)) {
      const msixDest = path.join(releaseOutDir, `zorbit-${tagName}-build${nextCode}.msix`);
      copyFileSync(env.WINDOWS_MSIX_OUTPUT, msixDest);
      console.log(`MSIX ready: ${msixDest}`);
    }
  } else if (existsSync(path.join(ROOT, 'src-tauri'))) {
    run('npm run tauri build');
  } else {
    console.log('Skipped: src-tauri/ or WINDOWS_MSIX_CMD not configured in .env.release');
  }

  logStep('7. iOS TestFlight via SSH (MacBook)');
  if (env.MACOS_SSH_HOST && env.MACOS_PROJECT_DIR) {
    const plist = env.IOS_EXPORT_OPTIONS_PLIST || 'ios/ExportOptions.plist';
    const remoteScript = [
      `cd ${env.MACOS_PROJECT_DIR}`,
      `git fetch --tags`,
      `git checkout ${tagName}`,
      `npm ci`,
      `npm run build`,
      `npx cap sync ios`,
      `xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -archivePath build/Zorbit.xcarchive archive`,
      `xcodebuild -exportArchive -archivePath build/Zorbit.xcarchive -exportOptionsPlist ${plist} -exportPath build/ipa`,
    ].join(' && ');
    runArgs('ssh', [env.MACOS_SSH_HOST, remoteScript]);
  } else {
    console.log('Skipped: MACOS_SSH_HOST / MACOS_PROJECT_DIR not set in .env.release');
  }

  logStep(`Release ${tagName} (build ${nextCode}) completed!`);
}

main();

