import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

import { inject as service } from '@ember/service';
export default class AccountingAccountsIndexDetailsController extends Controller {
    @service intl;
    @tracked overlay = null;

    get tabs() {
        return [
            { label: this.intl.t('literal.ledger.overview'), route: 'accounting.accounts.index.details.index' },
            { label: this.intl.t('literal.ledger.general-ledger'), route: 'accounting.accounts.index.details.ledger' },
        ];
    }

    get actionButtons() {
        return [];
    }
}
