<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

/**
 * Shared by any controller that needs to turn a product ID into the opaque
 * token embedded in its QR code, or resolve a scanned token back to an ID.
 */
trait ResolvesTraceTokens
{
    /**
     * Turn a product's numeric ID into an opaque, signed token safe to embed
     * in a QR code and use as a URL path segment — so scanning a code
     * doesn't hand out a guessable, enumerable database ID.
     */
    protected function makeTraceToken(int $productId): string
    {
        $encrypted = Crypt::encryptString((string) $productId);

        return rtrim(strtr($encrypted, '+/', '-_'), '=');
    }

    /**
     * Resolve a scanned trace token back to a product ID. Accepts a plain
     * numeric ID too (useful during manual testing, or for already-issued
     * codes from before tokens were signed) — anything else that fails to
     * decrypt is treated as not found.
     */
    protected function resolveTraceToken(string $token): ?int
    {
        if (ctype_digit($token)) {
            return (int) $token;
        }

        $base64 = strtr($token, '-_', '+/');
        $base64 .= str_repeat('=', (4 - strlen($base64) % 4) % 4);

        try {
            $decrypted = Crypt::decryptString($base64);
        } catch (DecryptException $e) {
            return null;
        }

        return ctype_digit($decrypted) ? (int) $decrypted : null;
    }
}
