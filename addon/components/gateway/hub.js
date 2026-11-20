import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';


export default class GatewayHubComponent extends Component {
    get DRIVER_COPY() {
        return {
        taler: {
            name: 'GNU Taler',
            icon: 'wallet',
            type: this.intl.t('literal.ledger.wallet-payment'),
            description: this.intl.t('literal.ledger.privacy-preserving-wallet-payments-qr-checkout-w-5e7ca'),
        },
        stripe: {
            name: 'Stripe',
            icon: 'credit-card',
            type: this.intl.t('literal.ledger.cards-and-wallets'),
            description: this.intl.t('literal.ledger.card-and-digital-wallet-processing-with-webhook-a6c0e'),
        },
        cash: {
            name: this.intl.t('literal.ledger.cash'),
            icon: 'money-bill-wave',
            type: this.intl.t('literal.ledger.manual-payment'),
            description: this.intl.t('literal.ledger.record-offline-or-in-person-payments-without-ext-7e9b4'),
        },
        qpay: {
            name: 'QPay',
            icon: 'qrcode',
            type: this.intl.t('literal.ledger.regional-payment'),
            description: this.intl.t('literal.ledger.regional-gateway-support-for-qr-and-local-paymen-119b7'),
        },
    };
    }

    @service intl;
    @service gatewayActions;
    @tracked table;

    get gateways() {
        return Array.from(this.args.gateways ?? []);
    }

    get summary() {
        return this.args.summary?.summary ?? {};
    }

    get drivers() {
        return Array.from(this.args.drivers ?? []);
    }

    get driverCards() {
        const configuredByDriver = new Map();

        this.gateways.forEach((gateway) => {
            const list = configuredByDriver.get(gateway.driver) ?? [];
            list.push(gateway);
            configuredByDriver.set(gateway.driver, list);
        });

        return ['taler', 'stripe', 'cash', 'qpay'].map((code) => {
            const manifest = this.drivers.find((driver) => driver.code === code) ?? {};
            const copy = this.DRIVER_COPY[code];
            const configured = configuredByDriver.get(code) ?? [];
            const active = configured.filter((gateway) => gateway.status === 'active');

            return {
                code,
                name: manifest.name ?? copy.name,
                icon: copy.icon,
                type: copy.type,
                description: copy.description,
                capabilities: manifest.capabilities ?? [],
                configuredCount: configured.length,
                activeCount: active.length,
                primaryGateway: configured[0],
                connected: configured.length > 0,
            };
        });
    }

    get hasGatewayConnections() {
        return this.gateways.length > 0;
    }

    get warningCount() {
        return Number(this.summary.webhook_warnings ?? 0);
    }

    get statusTiles() {
        return [
            {
                label: this.intl.t('literal.ledger.active-gateways'),
                value: this.summary.active_gateways ?? 0,
                caption: this.intl.t('literal.ledger.ready-to-collect-payments'),
                icon: 'plug',
                accentClass: Number(this.summary.active_gateways ?? 0) > 0 ? 'ledger-gateway-kpi-accent-green' : 'ledger-gateway-kpi-accent-blue',
            },
            {
                label: this.intl.t('literal.ledger.live-ready'),
                value: this.summary.live_gateways ?? 0,
                caption: this.intl.t('literal.ledger.production-connections'),
                icon: 'bolt',
                accentClass: Number(this.summary.live_gateways ?? 0) > 0 ? 'ledger-gateway-kpi-accent-blue' : 'ledger-gateway-kpi-accent-slate',
            },
            {
                label: this.intl.t('literal.ledger.webhook-issues'),
                value: this.warningCount,
                caption: this.warningCount > 0 ? this.intl.t('literal.ledger.need-provisioning-review') : this.intl.t('literal.ledger.no-open-warnings'),
                icon: 'link',
                accentClass: this.warningCount > 0 ? 'ledger-gateway-kpi-accent-amber' : 'ledger-gateway-kpi-accent-green',
            },
            {
                label: this.intl.t('literal.ledger.sandbox'),
                value: this.summary.sandbox_gateways ?? 0,
                caption: this.intl.t('literal.ledger.testing-connections'),
                icon: 'flask',
                accentClass: Number(this.summary.sandbox_gateways ?? 0) > 0 ? 'ledger-gateway-kpi-accent-amber' : 'ledger-gateway-kpi-accent-slate',
            },
        ];
    }

    @action setupTable(table) {
        this.table = table;
    }

    @action refresh() {
        if (typeof this.args.refresh === 'function') {
            this.args.refresh();
        }

        return this.gatewayActions.refresh();
    }

    @action openDriver(driver) {
        if (driver.primaryGateway) {
            return this.gatewayActions.transition.view(driver.primaryGateway);
        }

        return this.gatewayActions.transition.create(driver.code);
    }
}
