import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { isArray } from '@ember/array';
import { task } from 'ember-concurrency';


export default class AccountingGeneralLedgerController extends Controller {
    @service intl;

    get ACCOUNT_TYPES() {
        return [
        { label: this.intl.t('literal.ledger.all-types'), value: null },
        { label: this.intl.t('literal.ledger.asset'), value: 'asset' },
        { label: this.intl.t('literal.ledger.liability'), value: 'liability' },
        { label: this.intl.t('literal.ledger.equity'), value: 'equity' },
        { label: this.intl.t('literal.ledger.revenue'), value: 'revenue' },
        { label: this.intl.t('literal.ledger.expense'), value: 'expense' },
    ];
    }

    @service fetch;

    @tracked accounts = [];
    @tracked dateRange = null;
    @tracked date_from = null;
    @tracked date_to = null;
    @tracked type = null;

    /**
     * Plain object map of accountId → boolean for expanded state.
     * Tracked so HBS re-renders when it changes.
     */
    @tracked expandedMap = {};

    get accountTypes() {
        return this.ACCOUNT_TYPES;
    }

    get selectedType() {
        return this.ACCOUNT_TYPES.find((t) => t.value === this.type) ?? this.ACCOUNT_TYPES[0];
    }

    get allExpanded() {
        return this.accounts.length > 0 && this.accounts.every((a) => this.expandedMap[a.account.id]);
    }

    @task *loadGeneralLedger() {
        try {
            const params = {};
            if (this.date_from) params.date_from = this.date_from;
            if (this.date_to) params.date_to = this.date_to;
            if (this.type) params.type = this.type;

            const result = yield this.fetch.get('reports/general-ledger', params, { namespace: 'ledger/int/v1' });
            this.accounts = result?.data?.accounts ?? [];
        } catch {
            this.accounts = [];
        }
    }

    @action reload() {
        this.loadGeneralLedger.perform();
    }

    @action setType(option) {
        this.type = option?.value ?? null;
        this.loadGeneralLedger.perform();
    }

    @action onDateRangeChanged({ formattedDate }) {
        if (isArray(formattedDate) && formattedDate.length === 2) {
            this.date_from = formattedDate[0];
            this.date_to = formattedDate[1];
            this.loadGeneralLedger.perform();
        } else if (!formattedDate || formattedDate.length === 0) {
            this.date_from = null;
            this.date_to = null;
            this.loadGeneralLedger.perform();
        }
    }

    @action toggleAccount(accountId) {
        this.expandedMap = {
            ...this.expandedMap,
            [accountId]: !this.expandedMap[accountId],
        };
    }

    @action toggleExpandAll() {
        if (this.allExpanded) {
            this.expandedMap = {};
        } else {
            const map = {};
            this.accounts.forEach((a) => {
                map[a.account.id] = true;
            });
            this.expandedMap = map;
        }
    }
}
