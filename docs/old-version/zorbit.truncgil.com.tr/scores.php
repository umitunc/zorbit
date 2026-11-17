<?php include("config.php") ?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Best Scores</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
	<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js" integrity="sha384-IQsoLXl5PILFhosVNubq5LC7Qb9DXgDA9i+tQ8Zj3iwWAwPtgFTxbJ8NT4GN1R8p" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js" integrity="sha384-cVKIPhGWiC2Al4u+LWgxfKTRIcfu0JTxR+EQDz/bgldoEyl4H0zUF0QKbrJ0EcQF" crossorigin="anonymous"></script>
    <link href="https://fonts.googleapis.com/css2?family=Changa:wght@200;400;600;&display=swap" rel="stylesheet">
	<script src="jquery-3.4.1.min.js"></script>
    <style>
        body,h1,p{
            font-family: 'Changa', sans-serif;
            color: #e9827b;
        }
    </style>
    <script>
        $(function(){
            let playerName = localStorage.getItem("player");
            $(".player-info").html(playerName);
            $("."+playerName+"").addClass("table-primary")
        });
    </script>
</head>
<body class="bg-dark">
    <div class="container">
        <div class="row">
            <div class="col-12">
                <div class="text-center">
                    <img src="images/logo-sheet0.png" style="width:300px;" class="img-fluid m-5" alt="">
                    <h1 >Haftanın En İyileri</h1>
                    <div class="player-info"></div>
                </div>
                
                <table class="table table-bordered table-striped table-dark">
                    <tr>
                        <th>Sıra</th>
                        <th>Oyuncu</th>
                        <th>Puan</th>
                    </tr>
                    <?php $scores = ksorgu("scores","ORDER BY score DESC");
                    $k = 1;
                    while($s = kd($scores))  { 
                     
                     ?>
                     <tr class="<?php e($s['player']) ?>">
                        <td><?php e($k) ?></td>
                         <td><?php e($s['player']) ?></td>
                         <td><?php e($s['score']) ?></td>
                     </tr> 
                     <?php $k++; } ?>
                </table>
            </div>
        </div>
    </div>
</body>
</html>