<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Replaces Laravel's default ResetPassword notification, which sends a
 * clickable web URL (config('app.url').'/password-reset/{token}') — there is
 * no such web page here, this is a mobile-only API. Sends the raw reset
 * token as a code instead, for the user to type into the app.
 */
class ResetPasswordCode extends Notification
{
    public function __construct(public string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

        return (new MailMessage)
            ->subject('Your AgriTrace password reset code')
            ->greeting('Reset your password')
            ->line('Enter this code in the app to reset your password:')
            ->line(new \Illuminate\Support\HtmlString('<h2 style="letter-spacing:4px;">'.$this->token.'</h2>'))
            ->line("This code expires in {$minutes} minutes.")
            ->line('If you did not request a password reset, no further action is required.');
    }
}
