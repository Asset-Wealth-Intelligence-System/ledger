import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class ApplicationController extends Controller {
    @service intl;
    @service fetch;

    get navigationItems() {
        return [
            {
                label: this.intl.t('literal.ledger.dashboard'),
                description: this.intl.t('literal.ledger.ledger-dashboard-and-financial-overview'),
                icon: 'chart-simple',
                route: 'console.ledger.home',
                keywords: ['overview', 'metrics', 'finance dashboard'],
            },
            {
                label: this.intl.t('literal.ledger.billing'),
                description: this.intl.t('literal.ledger.invoices-and-reusable-invoice-templates'),
                icon: 'file-invoice-dollar',
                children: [
                    {
                        label: this.intl.t('literal.ledger.invoices'),
                        description: this.intl.t('literal.ledger.create-send-and-manage-customer-invoices'),
                        icon: 'file-invoice-dollar',
                        route: 'console.ledger.billing.invoices.index',
                        keywords: ['receivables', 'customers', 'payments due'],
                    },
                    {
                        label: this.intl.t('literal.ledger.invoice-templates'),
                        description: this.intl.t('literal.ledger.design-reusable-invoice-templates'),
                        icon: 'file-code',
                        route: 'console.ledger.billing.invoice-templates.index',
                        keywords: ['templates', 'invoice design', 'documents'],
                    },
                ],
            },
            {
                label: this.intl.t('literal.ledger.payments'),
                description: this.intl.t('literal.ledger.transactions-wallets-and-payment-gateways'),
                icon: 'money-bill-transfer',
                children: [
                    {
                        label: this.intl.t('literal.ledger.transactions'),
                        description: this.intl.t('literal.ledger.review-payment-and-wallet-transaction-history'),
                        icon: 'money-bill-transfer',
                        route: 'console.ledger.payments.transactions.index',
                        keywords: ['payments', 'charges', 'refunds', 'settlements'],
                    },
                    {
                        label: this.intl.t('literal.ledger.wallets'),
                        description: this.intl.t('literal.ledger.manage-company-customer-and-driver-wallets'),
                        icon: 'wallet',
                        route: 'console.ledger.payments.wallets.index',
                        keywords: ['balances', 'top ups', 'payouts'],
                    },
                    {
                        label: this.intl.t('literal.ledger.gateways'),
                        description: this.intl.t('literal.ledger.configure-payment-gateway-integrations'),
                        icon: 'credit-card',
                        route: 'console.ledger.payments.gateways.index',
                        keywords: ['stripe', 'payment providers', 'checkout'],
                    },
                ],
            },
            {
                label: this.intl.t('literal.ledger.accounting'),
                description: this.intl.t('literal.ledger.chart-of-accounts-journals-and-general-ledger'),
                icon: 'calculator',
                children: [
                    {
                        label: this.intl.t('literal.ledger.chart-of-accounts'),
                        description: this.intl.t('literal.ledger.manage-the-ledger-account-structure'),
                        icon: 'sitemap',
                        route: 'console.ledger.accounting.accounts.index',
                        keywords: ['accounts', 'coa', 'accounting'],
                    },
                    {
                        label: this.intl.t('literal.ledger.journal-entries'),
                        description: this.intl.t('literal.ledger.browse-and-create-double-entry-journal-entries'),
                        icon: 'book',
                        route: 'console.ledger.accounting.journal.index',
                        keywords: ['journals', 'debits', 'credits'],
                    },
                    {
                        label: this.intl.t('literal.ledger.general-ledger'),
                        description: this.intl.t('literal.ledger.review-posted-activity-across-accounts'),
                        icon: 'scroll',
                        route: 'console.ledger.accounting.general-ledger',
                        keywords: ['ledger', 'posted transactions', 'account activity'],
                    },
                ],
            },
            {
                label: this.intl.t('literal.ledger.reports'),
                description: this.intl.t('literal.ledger.financial-statements-and-operational-reports'),
                icon: 'chart-line',
                children: [
                    {
                        label: this.intl.t('literal.ledger.income-statement'),
                        description: this.intl.t('literal.ledger.revenue-expenses-and-net-income'),
                        icon: 'chart-line',
                        route: 'console.ledger.reports.income-statement',
                        keywords: ['profit and loss', 'pnl', 'revenue', 'expenses'],
                    },
                    {
                        label: this.intl.t('literal.ledger.balance-sheet'),
                        description: this.intl.t('literal.ledger.assets-liabilities-and-equity'),
                        icon: 'scale-balanced',
                        route: 'console.ledger.reports.balance-sheet',
                        keywords: ['assets', 'liabilities', 'equity'],
                    },
                    {
                        label: this.intl.t('literal.ledger.trial-balance'),
                        description: this.intl.t('literal.ledger.debit-and-credit-balances-by-account'),
                        icon: 'list-check',
                        route: 'console.ledger.reports.trial-balance',
                        keywords: ['debits', 'credits', 'balances'],
                    },
                    {
                        label: this.intl.t('literal.ledger.cash-flow'),
                        description: this.intl.t('literal.ledger.cash-movement-over-the-selected-period'),
                        icon: 'water',
                        route: 'console.ledger.reports.cash-flow',
                        keywords: ['cash', 'inflow', 'outflow'],
                    },
                    {
                        label: this.intl.t('literal.ledger.ar-aging'),
                        description: this.intl.t('literal.ledger.outstanding-receivables-by-age-bucket'),
                        icon: 'clock',
                        route: 'console.ledger.reports.ar-aging',
                        keywords: ['receivables', 'overdue invoices', 'aging'],
                    },
                    {
                        label: this.intl.t('literal.ledger.wallet-summary'),
                        description: this.intl.t('literal.ledger.wallet-balances-and-activity-summary'),
                        icon: 'wallet',
                        route: 'console.ledger.reports.wallet-summary',
                        keywords: ['wallet report', 'balances'],
                    },
                ],
            },
            {
                label: this.intl.t('literal.ledger.settings'),
                description: this.intl.t('literal.ledger.ledger-billing-payment-and-accounting-settings'),
                icon: 'gear',
                children: [
                    {
                        label: this.intl.t('literal.ledger.invoice-settings'),
                        description: this.intl.t('literal.ledger.configure-invoice-numbering-defaults-and-templat-9aada'),
                        icon: 'file-invoice',
                        route: 'console.ledger.settings.invoice',
                        keywords: ['invoice defaults', 'numbering', 'template'],
                    },
                    {
                        label: this.intl.t('literal.ledger.payment-settings'),
                        description: this.intl.t('literal.ledger.configure-payment-defaults-and-gateway-behavior'),
                        icon: 'gear',
                        route: 'console.ledger.settings.payment',
                        keywords: ['payments', 'gateway defaults'],
                    },
                    {
                        label: this.intl.t('literal.ledger.accounting-settings'),
                        description: this.intl.t('literal.ledger.configure-accounting-automation-and-posting-beha-7d3e1'),
                        icon: 'calculator',
                        route: 'console.ledger.settings.accounting',
                        keywords: ['journal automation', 'posting', 'accounts'],
                    },
                ],
            },
        ];
    }

    @action
    async searchNavigation({ query, limit = 12 }) {
        const trimmedQuery = query?.trim();

        if (!trimmedQuery) {
            return [];
        }

        try {
            const response = await this.fetch.get(
                'search',
                {
                    query: trimmedQuery,
                    limit,
                },
                {
                    namespace: 'ledger/int/v1',
                }
            );

            return response.results ?? [];
        } catch (_) {
            return [];
        }
    }
}
