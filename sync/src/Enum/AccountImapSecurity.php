<?php

namespace App\Enum;

class AccountImapSecurity {

    const __default = self::SSL;

    const SSL = 'SSL';
    const TLS = 'TLS';

    protected static $choices = [
        self::SSL  => 'Use SSL',
        self::TLS   => 'Use TLS'
    ];

    public static function getValues(): array
    {
        return \array_keys(static::$choices);
    }
}