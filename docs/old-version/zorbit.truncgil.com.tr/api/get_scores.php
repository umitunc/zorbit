<?php
header('Content-Type: application/json');

$db = new PDO("mysql:host=localhost;dbname=zorbit", "username", "password");

$stmt = $db->query("SELECT player_name, score, created_at 
                   FROM scores 
                   ORDER BY score DESC 
                   LIMIT 10");
                   
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC)); 