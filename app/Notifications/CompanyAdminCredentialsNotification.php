<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CompanyAdminCredentialsNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $tenantId,
        private readonly string $tempPassword,
        private readonly string $name,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->from(config('mail.from.address'), 'Alpha')
            ->subject('Your Company Admin Account Credentials')
            ->line('Your Company Admin account has been created.')
            ->line('Name: '.$this->name)
            ->line('Tenant ID: '.$this->tenantId)
            ->line('Temporary Password: '.$this->tempPassword)
            ->line('For security, please change your password after your first login.');
    }
}
