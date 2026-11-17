<?php
header('Content-Type: application/json');

$db = new PDO("mysql:host=localhost;dbname=zorbit", "username", "password");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $player_name = $data['player_name'];
    $score = $data['score'];
    
    $stmt = $db->prepare("INSERT INTO scores (player_name, score, created_at) VALUES (?, ?, NOW())");
    $result = $stmt->execute([$player_name, $score]);
    
    echo json_encode(['success' => $result]);
} 