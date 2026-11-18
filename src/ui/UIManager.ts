import { AppConfig } from '../core/config/AppConfig';
import type { IAudioPlayer } from '../core/interfaces/IAudioPlayer';
import type { GamePhase } from '../core/state/GameState';
import type { GameWorld } from '../core/state/GameWorld';
import type { LeaderboardEntry, LeaderboardService } from '../infrastructure/storage/LeaderboardService';

export class UIManager {
  private readonly loadingEl: HTMLElement;
  private readonly menuEl: HTMLElement;
  private readonly hudEl: HTMLElement;
  private readonly hudScoreEl: HTMLElement;
  private readonly menuScoreEl: HTMLElement;
  private readonly menuBestEl: HTMLElement;
  private readonly startBtn: HTMLButtonElement;
  private readonly soundBtn: HTMLButtonElement;
  private readonly fullscreenBtn: HTMLButtonElement;
  private readonly leaderboardBtn: HTMLButtonElement;
  private readonly playerBadgeBtn: HTMLButtonElement;
  private readonly playerNameTextEl: HTMLElement;

  private readonly leaderboardModalEl: HTMLElement;
  private readonly closeLeaderboardBtn: HTMLButtonElement;
  private readonly tabWeeklyBtn: HTMLButtonElement;
  private readonly tabArchiveBtn: HTMLButtonElement;
  private readonly leaderboardMetaEl: HTMLElement;
  private readonly leaderboardBodyEl: HTMLElement;

  private readonly usernameModalEl: HTMLElement;
  private readonly closeUsernameBtn: HTMLButtonElement;
  private readonly usernameInputEl: HTMLInputElement;
  private readonly usernameErrorEl: HTMLElement;
  private readonly saveUsernameBtn: HTMLButtonElement;

  private activeTab: 'weekly' | 'archive' = 'weekly';

  constructor(
    private readonly audio: IAudioPlayer,
    private readonly leaderboard: LeaderboardService,
    private readonly onStartClick: () => void
  ) {
    this.loadingEl = this.requireElement('screen-loading');
    this.menuEl = this.requireElement('screen-menu');
    this.hudEl = this.requireElement('screen-hud');
    this.hudScoreEl = this.requireElement('hud-score');
    this.menuScoreEl = this.requireElement('menu-score');
    this.menuBestEl = this.requireElement('menu-best');
    this.startBtn = this.requireElement('btn-start') as HTMLButtonElement;
    this.soundBtn = this.requireElement('btn-sound') as HTMLButtonElement;
    this.fullscreenBtn = this.requireElement('btn-fullscreen') as HTMLButtonElement;
    this.leaderboardBtn = this.requireElement('btn-leaderboard') as HTMLButtonElement;
    this.playerBadgeBtn = this.requireElement('btn-player-name') as HTMLButtonElement;
    this.playerNameTextEl = this.requireElement('player-name-text');

    this.leaderboardModalEl = this.requireElement('modal-leaderboard');
    this.closeLeaderboardBtn = this.requireElement('btn-close-leaderboard') as HTMLButtonElement;
    this.tabWeeklyBtn = this.requireElement('tab-weekly') as HTMLButtonElement;
    this.tabArchiveBtn = this.requireElement('tab-archive') as HTMLButtonElement;
    this.leaderboardMetaEl = this.requireElement('leaderboard-meta');
    this.leaderboardBodyEl = this.requireElement('leaderboard-body');

    this.usernameModalEl = this.requireElement('modal-username');
    this.closeUsernameBtn = this.requireElement('btn-close-username') as HTMLButtonElement;
    this.usernameInputEl = this.requireElement('input-username') as HTMLInputElement;
    this.usernameErrorEl = this.requireElement('username-error');
    this.saveUsernameBtn = this.requireElement('btn-save-username') as HTMLButtonElement;

    this.bindEvents();
    this.syncSoundButton();
    this.syncPlayerName();
    void this.leaderboard.ensureUniqueDefaultName().then(() => {
      this.syncPlayerName();
    });
    const versionEl = document.getElementById('app-version');
    if (versionEl) {
      versionEl.textContent = `v${AppConfig.VERSION} (${AppConfig.VERSION_CODE})`;
    }
  }

  public updatePhase(phase: GamePhase, world: GameWorld): void {
    this.loadingEl.classList.toggle('hidden', phase !== 'loading');
    this.menuEl.classList.toggle('hidden', phase !== 'menu');
    this.hudEl.classList.toggle('hidden', phase !== 'playing' && phase !== 'gameover');

    if (phase === 'menu') {
      this.menuScoreEl.textContent = String(world.score);
      this.menuBestEl.textContent = String(world.bestScore);
      this.menuScoreEl.classList.toggle('new-best', world.isNewBest);
    }

    if (phase === 'playing') {
      this.updateScore(world.score);
    }
  }

  public updateScore(score: number): void {
    if (score === 0) {
      this.hudScoreEl.textContent = 'Dokunun ve roketi diğer gezegene ateşleyin';
      this.hudScoreEl.classList.add('hint');
    } else {
      this.hudScoreEl.textContent = String(score);
      this.hudScoreEl.classList.remove('hint');
    }
  }

  private bindEvents(): void {
    this.startBtn.addEventListener('click', () => {
      this.onStartClick();
    });

    this.soundBtn.addEventListener('click', () => {
      const nextMuted = !this.audio.isMuted();
      this.audio.setMuted(nextMuted);
      if (!nextMuted) {
        this.audio.play('button2', -5);
      }
      this.syncSoundButton();
    });

    this.fullscreenBtn.addEventListener('click', () => {
      this.audio.play('button2', -5);
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen().catch(() => {});
      } else {
        void document.exitFullscreen().catch(() => {});
      }
    });

    this.leaderboardBtn.addEventListener('click', () => {
      this.audio.play('button2', -5);
      void this.openLeaderboardModal();
    });

    this.closeLeaderboardBtn.addEventListener('click', () => {
      this.leaderboardModalEl.classList.add('hidden');
    });

    this.leaderboardModalEl.addEventListener('click', (e) => {
      if (e.target === this.leaderboardModalEl) {
        this.leaderboardModalEl.classList.add('hidden');
      }
    });

    this.tabWeeklyBtn.addEventListener('click', () => {
      this.activeTab = 'weekly';
      this.tabWeeklyBtn.classList.add('active');
      this.tabArchiveBtn.classList.remove('active');
      void this.renderLeaderboardTab();
    });

    this.tabArchiveBtn.addEventListener('click', () => {
      this.activeTab = 'archive';
      this.tabArchiveBtn.classList.add('active');
      this.tabWeeklyBtn.classList.remove('active');
      void this.renderLeaderboardTab();
    });

    this.playerBadgeBtn.addEventListener('click', () => {
      this.audio.play('button2', -5);
      this.openUsernameModal();
    });

    this.closeUsernameBtn.addEventListener('click', () => {
      this.usernameModalEl.classList.add('hidden');
    });

    this.usernameModalEl.addEventListener('click', (e) => {
      if (e.target === this.usernameModalEl) {
        this.usernameModalEl.classList.add('hidden');
      }
    });

    this.saveUsernameBtn.addEventListener('click', () => {
      void this.handleSaveUsername();
    });

    this.usernameInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        void this.handleSaveUsername();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.leaderboardModalEl.classList.add('hidden');
        this.usernameModalEl.classList.add('hidden');
        return;
      }

      if (e.repeat) {
        return;
      }

      const isMenuVisible = !this.menuEl.classList.contains('hidden');
      const noModalOpen =
        this.leaderboardModalEl.classList.contains('hidden') &&
        this.usernameModalEl.classList.contains('hidden');

      if (
        isMenuVisible &&
        noModalOpen &&
        (e.code === 'Space' || e.code === 'Enter' || e.code === 'Tab' || e.code === 'ArrowUp')
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.onStartClick();
      }
    });
  }

  private syncPlayerName(): void {
    this.playerNameTextEl.textContent = this.leaderboard.getUsername();
  }

  private openUsernameModal(): void {
    this.usernameInputEl.value = this.leaderboard.getUsername();
    this.usernameErrorEl.classList.add('hidden');
    this.usernameModalEl.classList.remove('hidden');
    this.usernameInputEl.focus();
    this.usernameInputEl.select();
  }

  private async handleSaveUsername(): Promise<void> {
    this.saveUsernameBtn.disabled = true;
    const result = await this.leaderboard.setUsername(this.usernameInputEl.value);
    this.saveUsernameBtn.disabled = false;

    if (!result.ok) {
      this.usernameErrorEl.textContent = result.error ?? 'Geçersiz kullanıcı adı.';
      this.usernameErrorEl.classList.remove('hidden');
      return;
    }

    this.syncPlayerName();
    this.usernameModalEl.classList.add('hidden');
  }

  private async openLeaderboardModal(): Promise<void> {
    this.leaderboardModalEl.classList.remove('hidden');
    await this.renderLeaderboardTab();
  }

  private async renderLeaderboardTab(): Promise<void> {
    this.leaderboardBodyEl.replaceChildren();
    this.leaderboardMetaEl.textContent = 'Yükleniyor...';

    if (this.activeTab === 'weekly') {
      const data = await this.leaderboard.getWeeklyLeaderboard();
      this.renderMetaBar(data.weekId, data.source === 'remote');

      if (data.entries.length === 0) {
        this.appendEmptyMessage('Bu hafta henüz skor kaydedilmedi.');
        return;
      }

      data.entries.forEach((entry, idx) => {
        this.leaderboardBodyEl.appendChild(this.createRowElement(entry, idx));
      });
      return;
    }

    const archive = await this.leaderboard.getArchiveLeaderboard();
    this.renderMetaBar(
      archive.source === 'remote' ? 'Önceki Haftalar' : 'Arşiv',
      archive.source === 'remote'
    );

    if (archive.weeks.length === 0) {
      this.appendEmptyMessage('Önceki haftalara ait kayıt henüz yok.');
      return;
    }

    let rowIdx = 0;
    for (const week of archive.weeks) {
      const group = document.createElement('div');
      group.className = 'archive-week-block';

      const title = document.createElement('div');
      title.className = 'archive-week-title';
      title.textContent = week.label || week.weekId;
      group.appendChild(title);

      for (const winner of week.winners) {
        group.appendChild(this.createRowElement(winner, rowIdx++));
      }
      this.leaderboardBodyEl.appendChild(group);
    }
  }

  private renderMetaBar(leftText: string, isRemote: boolean): void {
    this.leaderboardMetaEl.replaceChildren();

    const leftPill = document.createElement('span');
    leftPill.className = 'meta-pill';
    leftPill.textContent = leftText;

    const statusPill = document.createElement('span');
    statusPill.className = 'meta-pill';

    const dot = document.createElement('span');
    dot.className = isRemote ? 'meta-dot remote' : 'meta-dot';

    const statusText = document.createElement('span');
    statusText.textContent = isRemote ? 'Canlı Sunucu' : 'Yerel Kayıt';

    statusPill.append(dot, statusText);
    this.leaderboardMetaEl.append(leftPill, statusPill);
  }

  private createRowElement(entry: LeaderboardEntry, index: number): HTMLElement {
    const row = document.createElement('div');
    const classes = ['leaderboard-row'];
    if (entry.rank >= 1 && entry.rank <= 3) {
      classes.push(`rank-${entry.rank}`);
    }
    if (entry.isCurrentUser) {
      classes.push('is-me');
    }
    row.className = classes.join(' ');
    row.style.setProperty('--row-index', String(index));

    const rankEl = document.createElement('span');
    rankEl.className = 'leaderboard-rank';
    rankEl.textContent =
      entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;

    const nameWrap = document.createElement('div');
    nameWrap.className = 'leaderboard-name-wrap';

    const nameEl = document.createElement('span');
    nameEl.className = 'leaderboard-name';
    nameEl.textContent = entry.username;
    nameWrap.appendChild(nameEl);

    if (entry.isCurrentUser) {
      const meTag = document.createElement('span');
      meTag.className = 'me-tag';
      meTag.textContent = 'SEN';
      nameWrap.appendChild(meTag);
    }

    const scoreEl = document.createElement('span');
    scoreEl.className = 'leaderboard-score';
    scoreEl.textContent = String(entry.score);

    row.append(rankEl, nameWrap, scoreEl);
    return row;
  }

  private appendEmptyMessage(message: string): void {
    const empty = document.createElement('div');
    empty.className = 'leaderboard-empty';
    empty.textContent = message;
    this.leaderboardBodyEl.appendChild(empty);
  }

  private syncSoundButton(): void {
    this.soundBtn.classList.toggle('muted', this.audio.isMuted());
  }

  private requireElement(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) {
      throw new Error(`Missing required UI element #${id}`);
    }
    return el;
  }
}
