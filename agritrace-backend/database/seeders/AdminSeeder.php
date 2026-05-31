<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            'name' => 'Test Admin',
            'email' => 'admin@agritrace.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
    }
}