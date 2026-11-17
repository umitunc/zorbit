<pre><?php 
include("config.php");
$player = veri(post("player"));
$varmi = ksorgu("scores","where player = $player limit 1");

$_POST['player'] = strip_tags(post("player"));
$_POST['score'] = strip_tags(post("score"));

if($varmi==0) {
    dekle("scores",[
        'player' => post("player")
    ]);
} else {
    dGuncelle("scores",[
        'score' => post("score"),
        'updated_at' => simdi()
    ],"player=$player");
}

?>

</pre>