<?php

declare(strict_types=1);

namespace ESim\App\Command;

use ESim\Api\Subscription\Domain\ActivationType;
use ESim\Api\Subscription\Domain\Subscription;
use ESim\Api\Subscription\Domain\SubscriptionMailer;
use ESim\Api\Subscription\Domain\SubscriptionSent;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * TEMPORARY QA TOOL - renders and sends a subscription email with fake data,
 * bypassing the real subscription flow (no clientId/packageId, no external
 * Voice/RDSDB calls). Uploaded and removed on demand by the
 * esim-api-send-subscription-email skill. Never leave this committed.
 */
#[AsCommand(name: 'app:qa:send-subscription-email', description: 'QA: send a subscription email with fake data, bypassing the real flow')]
class QaSendSubscriptionEmailCommand extends Command
{
    public function __construct(private readonly SubscriptionMailer $mailer)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Destination email address')
            ->addArgument('activationType', InputArgument::OPTIONAL, 'new|duplicate|express_duplicate', 'new');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email = $input->getArgument('email');
        $activationType = ActivationType::from($input->getArgument('activationType'));

        $subscription = (new \ReflectionClass(Subscription::class))->newInstanceWithoutConstructor();
        $this->setProperty($subscription, 'activationType', $activationType);
        $this->setProperty($subscription, 'iccid', '8934222211240099999');
        $this->setProperty($subscription, 'token', 'LPA:1$smdp.qa.digimobil.es$QA-TEST-ACTIVATION-CODE');
        $this->setProperty($subscription, 'phoneNumber', '600000000');
        $this->setProperty($subscription, 'pin', '1234');
        $this->setProperty($subscription, 'puk', '12345678');

        $subscriptionSent = SubscriptionSent::create(subscription: $subscription, email: $email);

        $this->mailer->send($subscriptionSent);

        $io->success("Email sent to {$email} using activationType={$activationType->value}");

        return Command::SUCCESS;
    }

    private function setProperty(object $object, string $property, mixed $value): void
    {
        $ref = new \ReflectionProperty($object, $property);
        $ref->setAccessible(true);
        $ref->setValue($object, $value);
    }
}
