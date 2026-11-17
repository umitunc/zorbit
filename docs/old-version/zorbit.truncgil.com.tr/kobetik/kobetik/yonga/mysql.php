<?php function coklu_sorgu($sorgu) {
	global $sunucu;
	global $kullanici;
	global $parola;
	global $veritabani;
$servername = $sunucu;
$username = $kullanici;
$password = $parola;
$dbname = $veritabani;

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
$conn->query("SET NAMES utf8");
if ($conn->connect_error) {
	
    die("Connection failed: " . $conn->connect_error);
} 
return mysqli_multi_query($conn,$sorgu);
/*
if ($conn->multi_query($sorgu) === TRUE) {
    echo "Tüm sorgular tek seferde işleme alınmıştır.";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}
*/
$conn->close();
} ?>
<?php function dGuncelle_yigin($tablo,$set,$where) {
	global $veritabani;
	global $baglanti;
	$toplamSet = "";
	$toplamWhere = "";
	$deger = "";
	$k = 0;
	foreach ($set as $anahtar => $deger) {
		if (is_string($deger)) {
			$deger = veri($deger);
			//echo $deger;
		}
		$toplamSet .= $anahtar . "=" . $deger . ",";
		
	}
	if (is_array($where)) {
		foreach ($where as $anahtar => $deger) {
			if (is_string($deger)) {
				$deger = veri($deger);
			}
			$toplamWhere .= $anahtar . "=" . tirnak_sil($deger) . " AND ";
		}
	$toplamWhere = substr($toplamWhere,0,strlen($toplamWhere)-5);
	} else {
		$toplamWhere = $where;
	}
	$toplamSet = substr($toplamSet,0,strlen($toplamSet)-1);
	$guncelleSQL = sprintf("UPDATE %s SET %s WHERE %s ;",
					 $tablo,
					  $toplamSet,
					   $toplamWhere);

	return $guncelleSQL;
}
?>
<?php function dEkle_yigin($tablo, $bilgiler,$debug=false,$trigger="",$id="id") {
	global $veritabani;
	global $baglanti;
	$toplamAlan = "";
	$toplamVeri = "";
	foreach ($bilgiler as $anahtar => $deger) { //anahtar değerleri alalım
		$toplamAlan .= $anahtar . ",";
	}


	foreach ($bilgiler as $anahtar => $deger) { // her anahtara ait değerleri alalım
		if (is_string($deger)) {
			$deger = veri($deger);
		} else if($deger=="") {
			$deger = veri($deger);
		}
		$toplamVeri .= $deger . ",";
	}
	$toplamAlan = substr($toplamAlan,0,strlen($toplamAlan)-1);
	$toplamVeri = substr($toplamVeri,0,strlen($toplamVeri)-1);

    $ekleSQL = sprintf("INSERT INTO %s (%s) VALUES (%s); ",$tablo,$toplamAlan,$toplamVeri);
	if($trigger=="") {
		trigger($tablo,$bilgiler,"ekle");
	}
	return $ekleSQL;
	
	//mysql_close($sonuc);
	//mysql_free_result($sonuc);
} ?>
<?php
$baglanti = new mysqli($sunucu, $kullanici, $parola, $veritabani) or trigger_error(mysqli_error(),E_USER_ERROR);
if (!function_exists("veri")) {
function veri($theValue, $theType="yazi", $theDefinedValue = "", $theNotDefinedValue = "")
{
	global $baglanti;
  if (PHP_VERSION < 6) {
    $theValue = get_magic_quotes_gpc() ? stripslashes($theValue) : $theValue;
  }

  $theValue = @function_exists("mysqli_real_escape_string") ? mysqli_real_escape_string($baglanti,$theValue) : mysqli_escape_string($baglanti,$theValue);

  switch ($theType) {
    case "yazi":
      $theValue = ($theValue != "") ? "'" . $theValue . "'" : "NULL";
      break;
    case "hok":
      $theValue = ($theValue != "") ? "'" . $theValue . "'" : "NULL";
  	  $theValue = htmlspecialchars($theValue);
      break;
    case "uzun":
    case "sayi":
      $theValue = ($theValue != "") ? intval($theValue) : "NULL";
      break;
    case "cift":
      $theValue = ($theValue != "") ? doubleval($theValue) : "NULL";
      break;
    case "tarih":
      $theValue = ($theValue != "") ? "'" . $theValue . "'" : "NULL";
      break;
    case "tanimsiz":
      $theValue = ($theValue != "") ? $theDefinedValue : $theNotDefinedValue;
      break;
  }
  return $theValue;
}
}
?>
<?php 
function tirnak_sil($data){
  $data = str_replace('"',"&quot;",$data);
  $data = str_replace("'","&#39;",$data);
  return $data;
}
 ?>
<?php function formEkle($tablo,$dizi) {
	$ayri = 0;
	foreach ($dizi as $anahtar => $deger) {
		
	switch ($tip) {
		case "yazı":
			$tip = "text";
		break;
		case "parola":
			$tip = "password";
		break;
		case "kutu":
			$tip = "textarea";
			$ayri = 1;
		break;
		case "menü":
			$tip = "select";
			$ayri = 1;
		break;
		case "tarih":
			$tip = "text";
		break;

	}
}
}
 ?>
 <?php function input_ajax($adres,$sinif=".input_d",$debug="") { ?>
<script language="javascript1.1" type="text/javascript">
$(function(){
						   $(<?php echo veri($sinif); ?>).blur(function(){
														
													   var yer = $(this);
																//yer.fadeTo("normal",0.5);
																//yer.attr("disabled","disabled");
																var jtablo = yer.attr("tablo"); //tablo adi
																var jd_alan = yer.attr("d_alan"); //SET alan adi
																var js_alan = yer.attr("s_alan"); // WHERE alan adi
																var js_kriter = yer.attr("s_kriter"); // sorgu WHere alan degeri
																var jd_kriter = $(this).val(); // degistirilen SET alan degeri
																console.log(parseFloat(jd_kriter));
																$.post(<?php echo veri($adres); ?>,{
																	   tablo : jtablo,
																	   d_alan : jd_alan,
																	   s_alan : js_alan,
																	   s_kriter : js_kriter,
																	   d_kriter : jd_kriter
																	   },function(data){
																		console.log(data);
																		   //alert(data);
																		//   yer.fadeTo("normal",1);
																		//   yer.removeAttr("disabled");
																		   });
													   }); 
						   $(<?php echo veri($sinif); ?>).change(function(){
														
													   var yer = $(this);
															//	yer.fadeTo("normal",0.5);
															//	yer.attr("disabled","disabled");
																var jtablo = yer.attr("tablo"); //tablo adi
																var jd_alan = yer.attr("d_alan"); //SET alan adi
																var js_alan = yer.attr("s_alan"); // WHERE alan adi
																var js_kriter = yer.attr("s_kriter"); // sorgu WHere alan degeri
																var jd_kriter = $(this).val(); // degistirilen SET alan degeri
																console.log(parseFloat(jd_kriter));
																$.post(<?php echo veri($adres); ?>,{
																	   tablo : jtablo,
																	   d_alan : jd_alan,
																	   s_alan : js_alan,
																	   s_kriter : js_kriter,
																	   d_kriter : jd_kriter
																	   },function(data){
																	   <?php if ($debug!="") {  ?>
																		   alert(data);
																		   <?php } ?>
																		   //alert(data);
																	//	   yer.fadeTo("normal",1);
																	//	   yer.removeAttr("disabled");
																		   });
													   }); 
													   });
</script>													

<?php } ?>
<?php function dSil($tablo, $kriter) {
	global $veritabani;
	global $baglanti;
	$toplamKriter = "";
	foreach ($kriter as $anahtar => $deger) {
		if (is_string($deger)) {
			$deger = veri($deger);
		}
		$toplamKriter .= $anahtar . "=" . $deger . " AND ";
	}
	$toplamKriter = substr($toplamKriter,0,strlen($toplamKriter)-5);
    $silSQL = sprintf("DELETE FROM %s WHERE %s",
											$tablo,
											$toplamKriter);
	return $silSQL;
    //mysql_select_db($veritabani);
    $sonuc = $baglanti->query($silSQL) or die($sorgu);
	mysqli_close($sorgu);
} ?>
<?php function hangi($dizi) {
	$ifade = "WHERE ";
	foreach ($dizi as $anahtar => $deger) {
		$ifade .= $anahtar . "";
		for ($k=0;$k<count($deger);$k++) {
			$ifade .= $deger[$k] . " ";
		}

	}
	return $ifade;
	}
	?>
<?php function dKriter($dizi) {
	$toplamKriter ="";
	foreach ($dizi as $anahtar => $deger) {
		$toplamKriter .= $anahtar . "";
		for ($k=0;$k<count($deger);$k++) {
			$toplamKriter .= $deger[$k] . " ";
		}

	}
	return $toplamKriter;
} ?>
<?php function dGuncelle($tablo,$set,$where) {
	global $veritabani;
	global $baglanti;
	$toplamSet = "";
	$toplamWhere = "";
	$deger = "";
	$k = 0;
	foreach ($set as $anahtar => $deger) {
		if (is_string($deger)) {
			$deger = veri($deger);
			//echo $deger;
		}
		$toplamSet .= $anahtar . "=" . $deger . ",";
		
	}
	if (is_array($where)) {
		foreach ($where as $anahtar => $deger) {
			if (is_string($deger)) {
				$deger = veri($deger);
			}
			$toplamWhere .= $anahtar . "=" . tirnak_sil($deger) . " AND ";
		}
	$toplamWhere = substr($toplamWhere,0,strlen($toplamWhere)-5);
	} else {
		$toplamWhere = $where;
	}
	$toplamSet = substr($toplamSet,0,strlen($toplamSet)-1);
	$guncelleSQL = sprintf("UPDATE %s SET %s WHERE %s",
					 $tablo,
					  $toplamSet,
					   $toplamWhere);
	//return $guncelleSQL;
  //mysql_select_db($veritabani);
  $Sonuc = $baglanti->query($guncelleSQL) or die($sorgu);
  trigger($tablo,$set,"guncelle");
  //mysqli_close($Sonuc);
}
?>
<?php function trigger($tablo,$array,$islem) {
	/*
	dEkle("log",array(
		"title" => "$tablo $islem yapıldı",
		"text" => @json_encode($array),
		"server" => json_encode($_SERVER),
		"date" => simdi()
	),false,"a");
	*/
	//include("/../../trigger.php");
	//e($tablo);
} ?>
<?php function dEkle($tablo, $bilgiler,$debug=false,$trigger="") {
	global $veritabani;
	global $baglanti;
	$toplamAlan = "";
	$toplamVeri = "";
	foreach ($bilgiler as $anahtar => $deger) { //anahtar değerleri alalım
		$toplamAlan .= $anahtar . ",";
	}

	
	foreach ($bilgiler as $anahtar => $deger) { // her anahtara ait değerleri alalım
		if (is_string($deger)) {
			$deger = veri($deger);
		} elseif($deger=="") {
			$deger = veri($deger);
		}
		$toplamVeri .= $deger . ",";
	}
	$toplamAlan = substr($toplamAlan,0,strlen($toplamAlan)-1);
	$toplamVeri = substr($toplamVeri,0,strlen($toplamVeri)-1);

    $ekleSQL = sprintf("INSERT INTO %s (%s) VALUES (%s)",$tablo,$toplamAlan,$toplamVeri);
	//e($ekleSQL);
	if($trigger=="") {
		trigger($tablo,$bilgiler,"ekle");
	}
//	e($ekleSQL);
	if($debug==true) {
	return $ekleSQL;
	} else {
		//mysql_select_db($veritabani);
	//	e($ekleSQL);
		$sonuc = $baglanti->query($ekleSQL) or die($ekleSQL);
		$sorgu = kd(sorgu("SELECT MAX(id) AS son FROM $tablo"));
		return $sorgu['son'];
	}
	mysqli_close($sonuc);
} ?>
<?php
function ekle($tablo,$alan,$veri) {
	global $veritabani;
	global $baglanti;
  $ekleSQL = sprintf("INSERT INTO %s (%s) VALUES (%s)",$tablo,$alan,$veri);

  //mysql_select_db($veritabani);
  $sonuc = $baglanti->query($ekleSQL) or die($ekleSQL);

}
?>
<?php 
function sToplam($sorgu) { //bir sorgunun toplam satır sayısını döndürür
	return @mysqli_num_rows($sorgu);
}
 ?>
<?php
function toplam($tablo,$kriter="") {
	global $veritabani;
	global $baglanti;
//mysql_select_db($veritabani);
$sorgu = sprintf("SELECT COUNT(*) AS toplam FROM %s",$tablo);
if ($kriter!="") {
	$sorgu = sprintf("%s WHERE %s",$sorgu, $kriter);
}
$sorgu = $baglanti->query($sorgu) or die($sorgu);
$row_sorgu = mysqli_fetch_assoc($sorgu);
return $row_sorgu['toplam'];
mysqli_close($sorgu);
}

?>
<?php function alansorgu($sorgu,$alan) {
	global $veritabani;
	global $baglanti;
	//mysql_select_db($veritabani);
	$sorgu = $baglanti->query($sorgu) or die($sorgu);
	$as = mysqli_fetch_assoc($sorgu);
	$totalRows_sorgu = mysqli_num_rows($sorgu);
	if ($totalRows_sorgu==0) {
		return 0;
	} else {
		return $as[$alan];
	}


	?>
<?php }?>
<?php
function sil($tablo,$kriter) {
	global $veritabani;
	global $baglanti;
  $silSQL = sprintf("DELETE FROM %s WHERE %s",
											$tablo,
											$kriter);

  //mysql_select_db($veritabani);
  $sonuc = $baglanti->query($silSQL) or die("Error -> $silSQL");
  trigger($tablo,$kriter,"sil");
}
?>
<?php
function guncelle($tablo,$set,$where) {
	global $veritabani;
	global $baglanti;
  $guncelleSQL = sprintf("UPDATE %s SET %s WHERE %s",
					 $tablo,
					  $set,
					   $where);
  //mysql_select_db($veritabani);
  $Sonuc = $baglanti->query($guncelleSQL) or die($sorgu);
}
?>
<?php
function hit($tablo,$alan,$where) {
	global $veritabani;
	global $baglanti;
  $guncelleSQL = sprintf("UPDATE %s SET %s WHERE %s",
					 $tablo,
					   "$alan = $alan + 1",
					   $where);
  //mysql_select_db($veritabani);
  $Sonuc = $baglanti->query($guncelleSQL) or die($sorgu);
}
?>
<?php function sirala($dizi) {
	$ifade = "ORDER BY ";
	foreach ($dizi as $anahtar => $deger) {
		switch ($deger) {
			case "artan" : 
				$deger = "ASC";
			break;
			case "azalan" :
				$deger = "DESC";
			break;
		}
		$ifade .= $anahtar . " " . $deger . ", ";
	}
	$ifade = substr($ifade,0,strlen($ifade)-2);
	return $ifade;
} ?>
<?php
function select($alanlar,$tablo,$diger="",$baslangic=0,$bitis=0) {
	global $veritabani;
	global $baglanti;
	$limit = "";
	$orderby = "";
	if ($diger!=""){
		$orderby = $diger;
	}
	if ($bitis!=0) {
		$limit = sprintf(" LIMIT %s, %s",$baslangic, $bitis);
	}
//mysql_select_db($veritabani);
$sorgu = sprintf("SELECT %s FROM %s %s",$alanlar,$tablo,$diger);
$sorgu = $baglanti->query($sorgu . $limit) or die($sorgu);
$totalRows_sorgu = mysqli_num_rows($sorgu);
if ($totalRows_sorgu==0) {
	return 0;
} else {
	return $sorgu;
}
}
?><?php
function idSorgu($tablo,$id) { //bir tablodaki id alanına değer gönderir tekil sorgulamaları kısaltmak içindir.
	global $veritabani;
	global $baglanti;
//mysql_select_db($veritabani);
$sorgu = sprintf("SELECT * FROM %s WHERE id = %s",$tablo,$id);
$sorgu = $baglanti->query($sorgu) or die($sorgu);
$totalRows_sorgu = mysqli_num_rows($sorgu);
if ($totalRows_sorgu==0) {
	return 0;
} else {
	return $sorgu;
}
}
?><?php
//unlink("kSorgu.log");
function kSorgu($tablo,$diger="",$baslangic=0,$bitis=0) {
	global $veritabani;
	global $baglanti;
	global $_SESSION;
	if($tablo=="content") {
		//e($diger);
		/*
		if(strpos($diger,"type='Randevu'")!==false) {
			$tablo = "content_randevu";
			error_log("$diger \n",3,"kSorgu.log");
		}
		*/
		if(strpos($diger,"type='Alan'")!==false) {
			$tablo = "content_alan";
			//error_log("$diger \n",3,"kSorgu.log");
		}
		//exit();
	}
	$limit = "";
	$orderby = "";
	if ($diger!=""){
		$orderby = $diger;
	}
	/*
	Muhasebe Başlangıcı
	*/
	$mdizi = explode(",","SİPARİŞ,SİPARİŞ2,ALIŞ,ALACAK,BORÇ");
	foreach($mdizi AS $m){
		if(strpos($diger,"type='$m'")!==false){
			$diger = str_replace("type='$m'","type='$m' AND date>='{$_SESSION['m-date']}'",$diger);
		}
	}

	if ($bitis!=0) {
		$limit = sprintf(" LIMIT %s, %s",$baslangic, $bitis);
	}
	////mysql_select_db($veritabani);
	$sorgu = sprintf("SELECT * FROM %s %s",$tablo,$diger);
	//err($sorgu,"sorgu.log");

	error_log($sorgu."\n",3,"son_sayfa.log");
	$sorgu = $baglanti -> query("/*" . "MYSQLND_QC_ENABLE_SWITCH" . "*/" .$sorgu . $limit) or die($sorgu . $limit);
	$totalRows_sorgu = mysqli_num_rows($sorgu);

	if ($totalRows_sorgu==0) {
		return 0;
	} else {
		return $sorgu;
		
	}
	$sorgu->free(); 
	mysqli_close($sorgu);
}

function ksorguCustom($sorguAlani){
	global $veritabani;
	global $baglanti;
	global $_SESSION;
	if($tablo=="content") {
		if(strpos($diger,"type='Alan'")!==false) {
			$tablo = "content_alan";
		}
	}
	$limit = "";
	$orderby = "";
	if ($diger!=""){
		$orderby = $diger;
	}
	$mdizi = explode(",","SİPARİŞ,SİPARİŞ2,ALIŞ,ALACAK,BORÇ");
	foreach($mdizi AS $m){
		if(strpos($diger,"type='$m'")!==false){
			$diger = str_replace("type='$m'","type='$m' AND date>='{$_SESSION['m-date']}'",$diger);
		}
	}

	if ($bitis!=0) {
		$limit = sprintf(" LIMIT %s, %s",$baslangic, $bitis);
	}
	$sorgu = sprintf("SELECT * FROM %s %s",$tablo,$diger);
	error_log($sorgu."\n",3,"son_sayfa.log");
	$sorgu = $baglanti -> query($sorguAlani) or die($sorguAlani);
	$totalRows_sorgu = mysqli_num_rows($sorgu);

	if ($totalRows_sorgu==0) {
		return 0;
	} else {
		return $sorgu;
		
	}
	$sorgu->free(); 
	mysqli_close($sorgu);
}
?><?php
function sorgu($sorgu,$baslangic=0,$bitis=0) {
	
	global $veritabani;
	global $baglanti;
	$limit = "";
	if ($bitis!=0) {
		$limit = sprintf(" LIMIT %s, %s",$baslangic, $bitis);
	}
	/*
	Muhasebe Başlangıcı
	*/
	$mdizi = explode(",","SİPARİŞ,SİPARİŞ2,ALIŞ,ALACAK,BORÇ");
	foreach($mdizi AS $m){
		if(strpos($sorgu,"type='$m'")!==false){
			$sorgu = str_replace("type='$m'","type='$m' AND date>='{$_SESSION['m-date']}'",$sorgu);
		}
	}
	//mysql_select_db($veritabani);
	$sorgu = $baglanti->query($sorgu . $limit) or die($sorgu);
	if(!$sorgu){
		echo("Error description: " . $baglanti -> error);
	}
	$totalRows_sorgu = mysqli_num_rows($sorgu);

	if ($totalRows_sorgu==0) {
		return 0;
	} else {
		return $sorgu;
	}

	$sorgu->free(); 
	mysqli_close($sorgu);
}


function pureQuery($query){

	global $veritabani;
	global $baglanti;


	$sorgu = $baglanti->query($query) or die($sorgu);
	if(!$sorgu){
		echo("Error description: " . $baglanti -> error);
	}
	//$totalRows_sorgu = mysqli_num_rows($sorgu);

	return $sorgu;

	$sorgu->free(); 
	mysqli_close($sorgu);

}

?>
<?php
function toplamkayit($dizi) {
	return @mysqli_num_rows($dizi);
}
?>
<?php
function kd($dizi) {
	if ($dizi) {
		return mysqli_fetch_assoc($dizi); 
	}
	
}
?>

<?php
function enbuyuk($tablo,$kriter="") {
	global $veritabani;
	global $baglanti;
//mysql_select_db($veritabani);
if ($kriter!="") {
$sorgu = sprintf("SELECT MAX(%s) AS en_buyuk FROM %s",$kriter, $tablo);
$sorgu = $baglanti->query($sorgu) or die($sorgu);
$row_sorgu = mysqli_fetch_assoc($sorgu);
return $row_sorgu['en_buyuk'];
} else {
	return "Tablo alan kriteri girilmediğinden işlem yapılmadı";
}
}

?>
<?php
function enkucuk($tablo,$kriter="") {
	global $veritabani;
	global $baglanti;
//mysql_select_db($veritabani);
if ($kriter!="") {
$sorgu = sprintf("SELECT MIN(%s) AS en_kucuk FROM %s",$kriter, $tablo);
$sorgu = $baglanti->query($sorgu) or die($sorgu);
$row_sorgu = mysqli_fetch_assoc($sorgu);
return $row_sorgu['en_kucuk'];
} else {
	return "Tablo alan kriteri girilmediğinden işlem yapılmadı";
}
}

?>
<?php
function kisa_sorgu($tablo,$kriter="") {
	global $veritabani;
	global $baglanti;
//mysql_select_db($veritabani);
$sorgu = sprintf("SELECT * FROM %s",$tablo);
if ($kriter!="") {
	$sorgu = sprintf("%s WHERE %s",$sorgu, $kriter);
}
$sorgu = $baglanti->query($sorgu) or die($sorgu);
return $sorgu;
}
?>
<?php
function birlestir($tablo,$diger="") {
	global $veritabani;
	global $baglanti;
//mysql_select_db($veritabani);
$sorgu = sprintf("SELECT * FROM %s",$tablo);
if ($diger!="") {
	$sorgu = sprintf("%s %s",$sorgu, $diger);
}
$sorgu = $baglanti->query($sorgu) or die($sorgu);
return $sorgu;
}
?>
<?php
function solb($tablo,$cengel) {
	global $veritabani;
	global $baglanti;
//mysql_select_db($veritabani);
$sorgu = sprintf("LEFT JOIN %s ON %s",$tablo, $cengel);
$sorgu = $baglanti->query($sorgu) or die($sorgu);
return $sorgu;
}
?>
<?php
function sagb($tablo,$cengel) {
	global $veritabani;
	global $baglanti;
//mysql_select_db($veritabani);
$sorgu = sprintf("RIGHT JOIN %s ON %s",$tablo, $cengel);
$sorgu = $baglanti->query($sorgu) or die($sorgu);
return $sorgu;
}
?>
<?php
function icb($tablo,$cengel) {
	global $veritabani;
	global $baglanti;
//mysql_select_db($veritabani);
$sorgu = sprintf("INNER JOIN %s ON %s",$tablo, $cengel);
$sorgu = $baglanti->query($sorgu) or die($sorgu);
return $sorgu;
}
?>