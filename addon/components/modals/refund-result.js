import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { inject as service } from '@ember/service';
export default class ModalsRefundResultComponent extends Component {
    @service intl;
    @tracked email = this.args.options.customerEmail ?? '';

    get isCompleted() {
        return this.args.options.walletStatus === 'accepted' || this.args.options.refundStatus === 'refunded';
    }

    get statusTitle() {
        return this.isCompleted ? this.intl.t('literal.ledger.refund-completed') : this.intl.t('literal.ledger.refund-uri-issued');
    }

    get statusMessage() {
        if (this.isCompleted) {
            return this.intl.t('literal.ledger.the-refund-was-accepted-by-the-customer-wallet-a-3c209');
        }

        return this.intl.t('literal.ledger.share-this-refund-uri-with-the-customer-so-they-df401');
    }

    @action setEmail(event) {
        this.email = event.target.value;
    }

    @action sendRefundUri() {
        return this.args.options.sendRefundUri?.(this.args.options.refund, this.email);
    }
}
