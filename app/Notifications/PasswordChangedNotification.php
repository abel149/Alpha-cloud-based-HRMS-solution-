<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordChangedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly ?string $ipAddress = null,
        private readonly ?string $userAgent = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Your password was changed')
            ->line('This is a confirmation that your account password was changed.')
            ->line('If you did not perform this action, please reset your password immediately and contact support.');

        if ($this->ipAddress) {
            $mail->line('IP Address: '.$this->ipAddress);
        }

        if ($this->userAgent) {
            $mail->line('Device: '.$this->userAgent);
        }

        return $mail;
    }
}
