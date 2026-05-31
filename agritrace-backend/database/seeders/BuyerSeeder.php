<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BuyerSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            'name' => 'Test Buyer',
            'email' => 'buyer@agritrace.com',
            'password' => Hash::make('password'),
            'role' => 'buyer',
        ]);
    }
}