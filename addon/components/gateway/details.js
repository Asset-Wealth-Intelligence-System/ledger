import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import copyToClipboard from '@fleetbase/ember-core/utils/copy-to-clipboard';

export default class GatewayDetailsComponent extends Component {
    @service intl;
    @service fetch;
    @service notifications;
    @service modalsManager;
    @service hostRouter;

    @tracked diagnostics = null;
    @tracked lastActionResult = null;

    constructor() {
        super(...arguments);
        this.loadDiagnostics.perform();
    }

    get isTaler() {
        return this.args.resource?.driver === 'taler';
    }

    get gatewayId() {
        return this.args.resource?.id;
    }

    get section() {
        return this.args.section ?? 'overview';
    }

    get showOverview() {
        return this.section === 'overview';
    }

    get showSetup() {
        return this.section === 'setup';
    }

    get showDiagnostics() {
        return this.section === 'diagnostics';
    }

    get driverLabel() {
        const driver = this.args.resource?.driver;

        if (!driver) {
            return this.intl.t('literal.ledger.gateway');
        }

        if (driver === 'taler') {
            return 'GNU Taler';
        }

        if (driver === 'qpay') {
            return 'QPay';
        }

        return driver.charAt(0).toUpperCase() + driver.slice(1);
    }

    get diagnosticSummary() {
        return this.diagnostics?.diagnostics ?? {};
    }

    get gatewaySummary() {
        return this.diagnostics?.gateway ?? {};
    }

    get webhookStatus() {
        return this.diagnosticSummary.webhook_registration ?? (this.args.resource?.webhook_url ? 'configured' : 'not_configured');
    }

    get lastWebhookAt() {
        return this.diagnosticSummary.last_webhook_received_at;
    }

    get lastPaymentAt() {
        return this.diagnosticSummary.last_payment_event_at;
    }

    get lastRefundAt() {
        return this.diagnosticSummary.last_refund_event_at;
    }

    get lastSettlementAt() {
        return this.diagnosticSummary.last_settlement_seen_at;
    }

    get reconciliationStatus() {
        return this.diagnosticSummary.last_reconciliation_status;
    }

    get credentialStatus() {
        return this.diagnosticSummary.credential_status ?? 'not_checked';
    }

    get lastCredentialTestedAt() {
        return this.diagnosticSummary.last_credential_tested_at;
    }

    get lastCredentialTestMessage() {
        return this.diagnosticSummary.last_credential_test_message;
    }

    get lastWebhookRegistrationAt() {
        return this.diagnosticSummary.last_webhook_registration_at;
    }

    get lastTestOrderAt() {
        return this.diagnosticSummary.last_test_order_at;
    }

    get lastTestOrderId() {
        return this.diagnosticSummary.last_test_order_id;
    }

    get credentialTileValue() {
        if (this.credentialStatus === 'success' || this.credentialStatus === 'ok') {
            return this.intl.t('literal.ledger.verified');
        }

        if (this.credentialStatus === 'failed') {
            return this.intl.t('literal.ledger.failed');
        }

        return this.intl.t('literal.ledger.not-checked');
    }

    get credentialAccentClass() {
        if (this.credentialStatus === 'success' || this.credentialStatus === 'ok') {
            return 'ledger-gateway-kpi-accent-green';
        }

        if (this.credentialStatus === 'failed') {
            return 'ledger-gateway-kpi-accent-rose';
        }

        return 'ledger-gateway-kpi-accent-slate';
    }

    get webhookRegistrationResultMessage() {
        if (this.lastWebhookRegistrationAt) {
            return this.intl.t('literal.ledger.provider-webhook-registration-completed');
        }

        if (this.webhookStatus === 'configured') {
            return this.intl.t('literal.ledger.webhook-url-is-configured-but-no-registration-ac-af674');
        }

        return this.intl.t('literal.ledger.no-provider-webhook-registration-stored');
    }

    get readinessItems() {
        return [
            {
                label: this.intl.t('literal.ledger.connection'),
                value: this.args.resource?.status === 'active' ? this.intl.t('literal.ledger.ready') : this.intl.t('literal.ledger.inactive'),
                status: this.args.resource?.status === 'active' ? 'ready' : 'inactive',
                icon: 'plug',
                caption: this.args.resource?.status === 'active' ? this.intl.t('literal.ledger.available-on-invoices') : this.intl.t('literal.ledger.not-used-at-checkout'),
                accentClass: this.args.resource?.status === 'active' ? 'ledger-gateway-kpi-accent-green' : 'ledger-gateway-kpi-accent-slate',
            },
            {
                label: this.intl.t('literal.ledger.environment'),
                value: this.args.resource?.environment === 'live' ? this.intl.t('literal.ledger.live') : this.intl.t('literal.ledger.sandbox'),
                status: this.args.resource?.environment ?? 'unknown',
                icon: 'server',
                caption: this.args.resource?.environment === 'live' ? this.intl.t('literal.ledger.production-payments') : this.intl.t('literal.ledger.testing-and-sandbox-use'),
                accentClass: this.args.resource?.environment === 'live' ? 'ledger-gateway-kpi-accent-blue' : 'ledger-gateway-kpi-accent-amber',
            },
            {
                label: 'Webhook',
                value: this.webhookStatus === 'configured' ? this.intl.t('literal.ledger.configured') : this.intl.t('literal.ledger.needs-setup'),
                status: this.webhookStatus === 'configured' ? 'configured' : 'needs setup',
                icon: 'link',
                caption: this.webhookStatus === 'configured' ? this.intl.t('literal.ledger.provider-callback-ready') : this.intl.t('literal.ledger.registration-needed'),
                accentClass: this.webhookStatus === 'configured' ? 'ledger-gateway-kpi-accent-green' : 'ledger-gateway-kpi-accent-amber',
            },
            {
                label: this.intl.t('literal.ledger.credentials'),
                value: this.credentialTileValue,
                status: this.credentialStatus,
                icon: 'key',
                caption: this.lastCredentialTestedAt ? this.intl.t('literal.ledger.last-provider-auth-test') : this.intl.t('literal.ledger.run-a-provider-check'),
                accentClass: this.credentialAccentClass,
            },
        ];
    }

    get providerStatusRows() {
        return [
            {
                label: this.intl.t('literal.ledger.driver'),
                value: this.driverLabel,
                icon: this.isTaler ? 'wallet' : 'plug',
            },
            {
                label: this.intl.t('literal.ledger.mode'),
                value: this.args.resource?.environment === 'live' ? this.intl.t('literal.ledger.live') : this.intl.t('literal.ledger.sandbox'),
                icon: this.args.resource?.environment === 'live' ? 'bolt' : 'flask',
            },
            {
                label: this.intl.t('literal.ledger.credentials'),
                value: this.credentialStatus === 'not_checked' ? this.intl.t('literal.ledger.not-checked-17063') : this.credentialStatus,
                caption: this.lastCredentialTestMessage,
                date: this.lastCredentialTestedAt,
                icon: 'key',
                status: this.credentialStatus === 'success' || this.credentialStatus === 'ok' ? 'success' : this.credentialStatus === 'failed' ? 'danger' : 'warning',
            },
            {
                label: 'Webhook',
                value: this.webhookStatus === 'configured' ? this.intl.t('literal.ledger.configured') : this.intl.t('literal.ledger.needs-setup-69f85'),
                date: this.lastWebhookRegistrationAt ?? this.lastWebhookAt,
                icon: 'link',
                status: this.webhookStatus === 'configured' ? 'success' : 'warning',
            },
            {
                label: this.intl.t('literal.ledger.payment'),
                value: this.lastPaymentAt ? this.intl.t('literal.ledger.seen') : this.intl.t('literal.ledger.no-payment-yet'),
                date: this.lastPaymentAt,
                icon: 'money-bill-transfer',
                status: this.lastPaymentAt ? 'success' : 'default',
            },
            {
                label: this.intl.t('literal.ledger.refund'),
                value: this.lastRefundAt ? this.intl.t('literal.ledger.seen') : this.intl.t('literal.ledger.no-refund-yet'),
                date: this.lastRefundAt,
                icon: 'rotate-left',
                status: this.lastRefundAt ? 'success' : 'default',
            },
            {
                label: this.intl.t('literal.ledger.settlement'),
                value: this.reconciliationStatus ?? this.intl.t('literal.ledger.not-checked-17063'),
                date: this.lastSettlementAt,
                icon: 'scale-balanced',
                status: this.reconciliationStatus ? 'success' : 'warning',
            },
        ];
    }

    get setupIdentityRows() {
        return [
            {
                label: this.intl.t('literal.ledger.name'),
                value: this.args.resource?.name,
            },
            {
                label: this.intl.t('literal.ledger.driver'),
                value: this.driverLabel,
            },
            {
                label: this.intl.t('literal.ledger.public-id'),
                value: this.args.resource?.public_id,
                mono: true,
                copyable: true,
            },
            {
                label: this.intl.t('literal.ledger.status'),
                value: this.args.resource?.status,
            },
            {
                label: this.intl.t('literal.ledger.environment'),
                value: this.args.resource?.environment ?? (this.args.resource?.is_sandbox ? 'sandbox' : 'live'),
            },
            {
                label: this.intl.t('literal.ledger.created'),
                value: this.args.resource?.createdAt ?? this.args.resource?.created_at,
                date: true,
            },
        ];
    }

    get setupRoutingRows() {
        return [
            {
                label: this.intl.t('literal.ledger.return-url'),
                value: this.args.resource?.return_url,
                mono: true,
                copyable: true,
            },
            {
                label: this.intl.t('literal.ledger.ledger-webhook-url'),
                value: this.args.resource?.system_webhook_url,
                mono: true,
                copyable: true,
            },
            {
                label: this.intl.t('literal.ledger.provider-registered-callback'),
                value: this.args.resource?.webhook_url,
                displayValue:
                    this.args.resource?.webhook_url && this.args.resource?.webhook_url === this.args.resource?.system_webhook_url
                        ? this.intl.t('literal.ledger.same-as-ledger-webhook-url')
                        : this.args.resource?.webhook_url,
                caption:
                    this.args.resource?.webhook_url && this.args.resource?.webhook_url === this.args.resource?.system_webhook_url
                        ? this.intl.t('literal.ledger.the-provider-posts-events-to-the-ledger-webhook-fed83')
                        : null,
                mono: true,
                copyable: true,
            },
        ];
    }

    get setupConfigRows() {
        const configSummary = this.gatewaySummary.config_summary ?? [];

        if (configSummary.length) {
            return configSummary;
        }

        return [
            {
                label: this.intl.t('literal.ledger.provider-credentials'),
                value: 'Stored encrypted and hidden',
            },
        ];
    }

    get recentActivity() {
        return [
            this.activityItem('Webhook', this.diagnostics?.last_webhook, 'link'),
            this.activityItem(this.intl.t('literal.ledger.payment'), this.diagnostics?.last_payment, 'money-bill-transfer'),
            this.activityItem(this.intl.t('literal.ledger.refund'), this.diagnostics?.last_refund, 'rotate-left'),
            this.activityItem(this.intl.t('literal.ledger.settlement'), this.diagnostics?.last_settlement, 'scale-balanced', this.lastSettlementAt),
        ].filter(Boolean);
    }

    get diagnosticsResults() {
        return [
            {
                label: this.intl.t('literal.ledger.credential-test'),
                value: this.lastCredentialTestMessage ?? this.intl.t('literal.ledger.no-credential-test-has-been-run'),
                date: this.lastCredentialTestedAt,
                status: this.credentialStatus === 'success' || this.credentialStatus === 'ok' ? 'success' : this.credentialStatus === 'failed' ? 'danger' : 'warning',
            },
            {
                label: this.intl.t('literal.ledger.webhook-registration'),
                value: this.webhookRegistrationResultMessage,
                date: this.lastWebhookRegistrationAt,
                status: this.lastWebhookRegistrationAt ? 'success' : 'warning',
            },
            {
                label: this.intl.t('literal.ledger.test-order'),
                value: this.lastTestOrderId ? this.intl.t('literal.ledger.last-order', { lastTestOrderId: this.lastTestOrderId }) : this.intl.t('literal.ledger.no-test-order-has-been-created'),
                date: this.lastTestOrderAt,
                status: this.lastTestOrderId ? 'success' : 'warning',
            },
        ];
    }

    get diagnosticActions() {
        if (!this.isTaler) {
            return [];
        }

        return [
            {
                key: 'test-credentials',
                title: this.intl.t('literal.ledger.test-credentials'),
                description: this.intl.t('literal.ledger.checks-whether-ledger-can-authenticate-against-t-9ee1c'),
                expectedResult: this.intl.t('literal.ledger.updates-credential-status-and-last-checked-time'),
                icon: this.testCredentials.isRunning ? 'spinner' : 'check-circle',
                isLoading: this.testCredentials.isRunning,
                task: this.testCredentials,
                primary: true,
            },
            {
                key: 'register-webhook',
                title: this.intl.t('literal.ledger.register-webhook'),
                description: this.intl.t('literal.ledger.creates-or-updates-the-taler-webhook-so-payment-9a886'),
                expectedResult: this.intl.t('literal.ledger.stores-the-registered-webhook-url-and-routing-pa-d62da'),
                icon: this.registerWebhook.isRunning ? 'spinner' : 'link',
                isLoading: this.registerWebhook.isRunning,
                task: this.registerWebhook,
                confirm: true,
                confirmTitle: this.intl.t('literal.ledger.register-taler-webhook'),
                confirmBody: this.intl.t('literal.ledger.ledger-will-create-or-update-the-webhook-in-the-00082'),
            },
            {
                key: 'create-test-order',
                title: this.intl.t('literal.ledger.create-test-order'),
                description: this.intl.t('literal.ledger.creates-a-small-sandbox-order-to-verify-order-cr-3649b'),
                expectedResult: this.intl.t('literal.ledger.creates-a-provider-test-order-and-records-its-or-831cb'),
                icon: this.createTestOrder.isRunning ? 'spinner' : 'flask',
                isLoading: this.createTestOrder.isRunning,
                task: this.createTestOrder,
                confirm: true,
                confirmTitle: this.intl.t('literal.ledger.create-taler-test-order'),
                confirmBody: this.intl.t('literal.ledger.ledger-will-create-a-test-order-in-the-configure-2197d'),
            },
            {
                key: 'refresh',
                title: this.intl.t('literal.ledger.refresh-diagnostics'),
                description: this.intl.t('literal.ledger.reloads-the-latest-credential-webhook-payment-re-04d42'),
                expectedResult: 'No provider mutation; refreshes this screen only.',
                icon: this.loadDiagnostics.isRunning ? 'spinner' : 'rotate',
                isLoading: this.loadDiagnostics.isRunning,
                task: this.loadDiagnostics,
                secondary: true,
            },
        ];
    }

    get overviewActions() {
        return [
            ...this.diagnosticActions.filter((diagnosticAction) => diagnosticAction.key !== 'refresh'),
            {
                key: 'copy-webhook-url',
                title: this.intl.t('literal.ledger.copy-webhook-url'),
                description: this.intl.t('literal.ledger.copies-the-ledger-callback-url-for-manual-provid-6b30c'),
                expectedResult: this.intl.t('literal.ledger.use-this-when-provider-webhook-registration-is-h-cd92e'),
                icon: 'copy',
                action: this.copySystemWebhookUrl,
                secondary: true,
            },
            {
                key: 'edit-settings',
                title: this.intl.t('literal.ledger.edit-settings'),
                description: this.intl.t('literal.ledger.change-the-gateway-name-credentials-routing-stat-72720'),
                expectedResult: this.intl.t('literal.ledger.opens-the-gateway-setup-wizard-for-this-existing-c398f'),
                icon: 'pen-to-square',
                action: this.editGateway,
                secondary: true,
            },
        ];
    }

    activityItem(label, record, icon, fallbackDate) {
        if (!record && !fallbackDate) {
            return null;
        }

        return {
            label,
            icon,
            status: record?.status ?? record?.event_type ?? this.reconciliationStatus ?? 'seen',
            message: record?.message ?? record?.description ?? (label === 'Settlement' ? this.reconciliationStatus : null),
            date: record?.created_at ?? record?.createdAt ?? fallbackDate,
            reference: record?.gateway_reference_id ?? record?.id,
        };
    }

    @task({ restartable: true })
    *loadDiagnostics() {
        if (!this.gatewayId) return;

        try {
            this.diagnostics = yield this.fetch.get(`gateways/${this.gatewayId}/diagnostics`, {}, { namespace: 'ledger/int/v1' });
        } catch {
            this.diagnostics = null;
        }
    }

    @task({ drop: true })
    *testCredentials() {
        yield* this.runGatewayAction('test-credentials', 'Taler credentials accepted.');
    }

    @task({ drop: true })
    *createTestOrder() {
        yield* this.runGatewayAction('create-test-order', 'Taler test order created.');
    }

    @task({ drop: true })
    *registerWebhook() {
        yield* this.runGatewayAction('register-webhook', 'Taler webhook registered.');
    }

    @action runDiagnosticAction(diagnosticAction) {
        if (diagnosticAction.action) {
            return diagnosticAction.action();
        }

        if (diagnosticAction.confirm) {
            return this.modalsManager.confirm({
                title: diagnosticAction.confirmTitle,
                body: diagnosticAction.confirmBody,
                acceptButtonText: diagnosticAction.title,
                confirm: () => diagnosticAction.task.perform(),
            });
        }

        return diagnosticAction.task.perform();
    }

    @action editGateway() {
        return this.hostRouter.transitionTo('console.ledger.payments.gateways.edit', this.args.resource);
    }

    @action copySystemWebhookUrl() {
        const url = this.args.resource?.system_webhook_url;

        if (!url) {
            return this.notifications.warning(this.intl.t('literal.ledger.no-system-webhook-url-is-available-yet'));
        }

        copyToClipboard(url)
            .then(() => this.notifications.success(this.intl.t('literal.ledger.system-webhook-url-copied')))
            .catch(() => this.notifications.error(this.intl.t('literal.ledger.unable-to-copy-webhook-url')));
    }

    *runGatewayAction(action, successMessage) {
        if (!this.gatewayId) return;

        try {
            const result = yield this.fetch.post(`gateways/${this.gatewayId}/${action}`, {}, { namespace: 'ledger/int/v1' });
            this.lastActionResult = result;
            this.notifications.success(result?.message ?? successMessage);
            yield this.loadDiagnostics.perform();
        } catch (error) {
            this.notifications.serverError(error);
        }
    }
}
