<?php
declare(strict_types=1);

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/response.php';

// Allow only GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method Not Allowed', 405);
}

try {
    $pdo = db();

    // 1. Get the latest year available in the dataset
    $stmtYear = $pdo->prepare("SELECT MAX(year) AS max_year FROM waste_stats");
    $stmtYear->execute();
    $latestYear = (int) $stmtYear->fetchColumn();

    if ($latestYear === 0) {
        json_response([
            'year' => null,
            'top' => [],
            'bangsaen' => null
        ]);
    }

    // 2. Get Top 5 local governments by generated waste for the latest year
    $stmtTop = $pdo->prepare(
        "SELECT local_gov, generated_tpd 
         FROM waste_stats 
         WHERE year = :year AND generated_tpd IS NOT NULL
         ORDER BY generated_tpd DESC 
         LIMIT 5"
    );
    $stmtTop->execute([':year' => $latestYear]);
    
    $top = [];
    while ($row = $stmtTop->fetch()) {
        $top[] = [
            'local_gov' => $row['local_gov'],
            'generated_tpd' => (float) $row['generated_tpd']
        ];
    }

    // 3. Get Bangsaen (Saensuk Municipality) stats for the latest year
    $stmtBangsaen = $pdo->prepare(
        "SELECT generated_tpd, proper_tpd 
         FROM waste_stats 
         WHERE year = :year AND local_gov = 'เทศบาลเมืองแสนสุข' 
         LIMIT 1"
    );
    $stmtBangsaen->execute([':year' => $latestYear]);
    $bsRow = $stmtBangsaen->fetch();

    $bangsaen = null;
    if ($bsRow) {
        $generated = $bsRow['generated_tpd'];
        $proper = $bsRow['proper_tpd'];
        
        // Cast to float for JSON output
        $generatedFloat = $generated !== null ? (float) $generated : null;
        $properFloat = $proper !== null ? (float) $proper : null;

        // Guard against division by zero or null generated value
        // Note: PDO returns strings for DECIMAL; cast to float before comparison
        $rate = null;
        if ($generatedFloat !== null && $generatedFloat > 0.0 && $properFloat !== null) {
            $rate = round(($properFloat / $generatedFloat) * 100, 1);
        }

        $bangsaen = [
            'generated_tpd' => $generatedFloat,
            'proper_tpd' => $properFloat,
            'proper_rate' => $rate
        ];
    }

    json_response([
        'year' => $latestYear,
        'top' => $top,
        'bangsaen' => $bangsaen
    ]);

} catch (PDOException $e) {
    // Log $e->getMessage() in production; return generic message to client
    json_error('database error', 500);
}
