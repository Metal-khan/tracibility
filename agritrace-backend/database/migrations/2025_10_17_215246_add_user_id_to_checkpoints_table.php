<?php

// app/database/migrations/xxxx_xx_xx_add_user_id_to_checkpoints_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // This used to assume user_id had already been added by hand on the
        // original development database and did nothing here — which meant
        // any fresh install (a new clone, CI, a real deployment) never got
        // the column at all, and checkpoint logging (Checkpoint::create())
        // crashed with "no such column: user_id" since Checkpoint::$fillable
        // and its user() relation both depend on it existing.
        if (!Schema::hasColumn('checkpoints', 'user_id')) {
            Schema::table('checkpoints', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('product_id')->constrained('users')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkpoints', function (Blueprint $table) {
            // Drop the foreign key constraint and the column
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};