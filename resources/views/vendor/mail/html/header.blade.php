@props(['url'])
<tr>
<td class="header" style="background: linear-gradient(135deg, #FF13A0 0%, #269850 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel')
<img src="https://laravel.com/img/notification-logo.png" class="logo" alt="Laravel Logo">
@else
<h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">{!! $slot !!}</h1>
@endif
</a>
</td>
</tr>
