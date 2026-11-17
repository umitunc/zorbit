<?php 
error_reporting(E_ALL);
ini_set("error_reporting",1); 
ob_start();   
/*
Trunçgil Teknoloji 2012
Kobetik Beta v1.3
Yazan (Author) : Ümit TUNÇ
*/
?>
<?php
if (!isset($_SESSION)) {
	  session_start();
}
function isMobile() {
    return preg_match("/(android|avantgo|blackberry|bolt|boost|cricket|docomo|fone|hiptop|mini|mobi|palm|phone|pie|tablet|up\.browser|up\.link|webos|wos)/i", $_SERVER["HTTP_USER_AGENT"]);
}

if(isMobile()){
 //    header("Location: https://amp.trdoktor.com/");
}


////////ELFINDER////////////
$depo = "aa/lib/elfinder/files";

?>
<?php //require("ayarlar.php"); ?>
<?php require("yonga/yonga.php"); 
$baglanti->query("SET NAMES utf8");
?>