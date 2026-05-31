<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class FarmerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            'name' => 'Test Farmer',
            'email' => 'farmer@agritrace.com',
            'password' => Hash::make('password'),
            'role' => 'farmer',
        ]);
    }
}