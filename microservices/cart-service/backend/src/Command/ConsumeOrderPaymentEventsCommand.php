<?php

namespace App\Command;

use App\Service\OrderServiceInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Uid\Uuid;

#[AsCommand(
    name: 'app:consume-order-payment-events',
    description: 'Consumes order payment lifecycle events from Kafka and updates order state.',
)]
class ConsumeOrderPaymentEventsCommand extends Command
{
    public function __construct(
        private readonly OrderServiceInterface $orderService,
        #[Autowire('%env(KAFKA_BOOTSTRAP_SERVERS)%')]
        private readonly string $kafkaBootstrapServers,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if (!class_exists(\RdKafka\Conf::class)) {
            $io->error('The rdkafka PHP extension is not installed.');
            return Command::FAILURE;
        }

        $conf = new \RdKafka\Conf();
        $conf->set('group.id', 'cart-service-order-payments');
        $conf->set('metadata.broker.list', $this->kafkaBootstrapServers);
        $conf->set('auto.offset.reset', 'earliest');
        $conf->set('enable.auto.commit', 'true');

        $consumer = new \RdKafka\KafkaConsumer($conf);
        $consumer->subscribe([
            'order-payment.completed',
            'order-payment.failed',
            'order-payment.expired',
        ]);

        $io->success('Listening for order payment events...');

        while (true) {
            $message = $consumer->consume(1000);

            switch ($message->err) {
                case RD_KAFKA_RESP_ERR_NO_ERROR:
                    $this->handleMessage($message->topic_name, $message->payload, $io);
                    break;
                case RD_KAFKA_RESP_ERR__PARTITION_EOF:
                case RD_KAFKA_RESP_ERR__TIMED_OUT:
                    break;
                default:
                    $io->warning('Kafka consumer error: ' . $message->errstr());
                    break;
            }
        }

        return Command::SUCCESS;
    }

    private function handleMessage(string $topic, string $payload, SymfonyStyle $io): void
    {
        $data = json_decode($payload, true);

        if (!is_array($data) || empty($data['orderId'])) {
            $io->warning('Skipping malformed order payment event payload.');
            return;
        }

        $orderId = Uuid::fromString($data['orderId']);

        match ($topic) {
            'order-payment.completed' => $this->orderService->markPaymentCompleted($orderId),
            'order-payment.failed' => $this->orderService->markPaymentFailed($orderId),
            'order-payment.expired' => $this->orderService->markPaymentExpired($orderId),
            default => null,
        };
    }
}
