<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LogisticsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            'name' => 'Test Logistics',
            'email' => 'logistics@agritrace.com',
            'password' => Hash::make('password'),
            'role' => 'logistics',
        ]);
    }
}