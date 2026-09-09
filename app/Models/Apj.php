<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Apj extends Model
{
    use HasFactory;

    protected $dates = [
        'masa_berlaku',
    ];

    protected $casts = [
        'masa_berlaku' => 'datetime',
    ];

    protected $fillable = [
        'nama_apj',
        'no_sip',
        'masa_berlaku',
    ];

    public function perizinans(): HasMany
    {
        return $this->hasMany(Perizinan::class);
    }
}
