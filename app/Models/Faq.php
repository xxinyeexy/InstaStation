<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Faq extends Model
{
     use HasFactory;

     protected $table = 'faqs';
     protected $primaryKey = 'faq_id';
     protected $fillable = [
          'faq_question',
          'faq_answer',
          'category',
          'faq_status',
     ];
}
