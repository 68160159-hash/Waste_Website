<?php
declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/response.php';
require __DIR__ . '/../lib/validate.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Validate optional type filter
    $typeFilter = null;
    if (isset($_GET['type']) && $_GET['type'] !== '') {
        $validTypes = ['general', 'recyclable', 'hazardous', 'organic'];
        if (!in_array($_GET['type'], $validTypes, true)) {
            json_error('type ต้องเป็นหนึ่งใน general, recyclable, hazardous, organic', 422);
        }
        $typeFilter = $_GET['type'];
    }

    try {
        $pdo = db();

        if ($typeFilter !== null) {
            $stmt = $pdo->prepare(
                "SELECT id, location, waste_type, amount_kg, detail, status, created_at 
                 FROM reports 
                 WHERE waste_type = :type 
                 ORDER BY created_at DESC 
                 LIMIT 20"
            );
            $stmt->execute([':type' => $typeFilter]);
        } else {
            $stmt = $pdo->prepare(
                "SELECT id, location, waste_type, amount_kg, detail, status, created_at 
                 FROM reports 
                 ORDER BY created_at DESC 
                 LIMIT 20"
            );
            $stmt->execute();
        }

        $reports = [];
        while ($row = $stmt->fetch()) {
            $reports[] = [
                'id' => (int) $row['id'],
                'location' => $row['location'],
                'waste_type' => $row['waste_type'],
                'amount_kg' => (int) $row['amount_kg'],
                'detail' => $row['detail'],
                'status' => $row['status'],
                'created_at' => $row['created_at']
            ];
        }

        json_response($reports);
    } catch (PDOException $e) {
        json_error('database error', 500);
    }

} elseif ($method === 'POST') {
    // Parse JSON body
    $rawBody = file_get_contents('php://input');
    $data = json_decode($rawBody, true);

    if (!is_array($data)) {
        json_error('Invalid JSON format', 400);
    }

    // Validate input
    try {
        $cleanData = validate_report($data);
    } catch (InvalidArgumentException $e) {
        json_error($e->getMessage(), 422);
    }

    // Insert into database
    try {
        $pdo = db();
        $stmt = $pdo->prepare(
            "INSERT INTO reports (location, waste_type, amount_kg, detail) 
             VALUES (:location, :waste_type, :amount_kg, :detail)"
        );

        $stmt->execute([
            ':location' => $cleanData['location'],
            ':waste_type' => $cleanData['waste_type'],
            ':amount_kg' => $cleanData['amount_kg'],
            ':detail' => $cleanData['detail']
        ]);

        $newId = (int) $pdo->lastInsertId();

        json_response([
            'id' => $newId,
            'location' => $cleanData['location'],
            'waste_type' => $cleanData['waste_type'],
            'amount_kg' => $cleanData['amount_kg'],
            'detail' => $cleanData['detail'],
            'status' => 'new',
            'created_at' => date('Y-m-d H:i:s')
        ], 201);

    } catch (PDOException $e) {
        json_error('database error', 500);
    }

} else {
    json_error('Method Not Allowed', 405);
}