<?php
declare(strict_types=1);

const VALID_WASTE_TYPES = ['general', 'recyclable', 'hazardous', 'organic'];

function validate_report(array $data): array
{
    // Validate location
    if (!array_key_exists('location', $data) || !is_string($data['location'])) {
        throw new InvalidArgumentException('location ต้องเป็น string ที่ยาว 3–100 ตัวอักษร');
    }
    $location = trim($data['location']);
    $locLen = mb_strlen($location, 'UTF-8');
    if ($locLen < 3 || $locLen > 100) {
        throw new InvalidArgumentException('location ต้องเป็น string ที่ยาว 3–100 ตัวอักษร');
    }

    // Validate waste_type
    if (!array_key_exists('waste_type', $data) || !in_array($data['waste_type'], VALID_WASTE_TYPES, true)) {
        throw new InvalidArgumentException('waste_type ต้องเป็นหนึ่งใน ' . json_encode(VALID_WASTE_TYPES));
    }
    $wasteType = $data['waste_type'];

    // Validate amount_kg
    if (!array_key_exists('amount_kg', $data)) {
        throw new InvalidArgumentException('amount_kg ต้องเป็นจำนวนเต็มระหว่าง 1–1000');
    }
    $rawAmount = $data['amount_kg'];

    // Reject bool and float explicitly
    if (is_bool($rawAmount) || is_float($rawAmount)) {
        throw new InvalidArgumentException('amount_kg ต้องเป็นจำนวนเต็มระหว่าง 1–1000');
    }

    // Accept int directly or string of pure digits
    if (is_int($rawAmount)) {
        $amountKg = $rawAmount;
    } elseif (is_string($rawAmount) && ctype_digit($rawAmount)) {
        $amountKg = (int) $rawAmount;
    } else {
        throw new InvalidArgumentException('amount_kg ต้องเป็นจำนวนเต็มระหว่าง 1–1000');
    }

    if ($amountKg < 1 || $amountKg > 1000) {
        throw new InvalidArgumentException('amount_kg ต้องเป็นจำนวนเต็มระหว่าง 1–1000');
    }

    // Validate detail (optional, default "")
    $detail = '';
    if (array_key_exists('detail', $data)) {
        if (!is_string($data['detail'])) {
            throw new InvalidArgumentException('detail ต้องเป็น string ที่ยาวไม่เกิน 500 ตัวอักษร');
        }
        $detail = $data['detail'];
        if (mb_strlen($detail, 'UTF-8') > 500) {
            throw new InvalidArgumentException('detail ต้องเป็น string ที่ยาวไม่เกิน 500 ตัวอักษร');
        }
    }

    return [
        'location' => $location,
        'waste_type' => $wasteType,
        'amount_kg' => $amountKg,
        'detail' => $detail,
    ];
}