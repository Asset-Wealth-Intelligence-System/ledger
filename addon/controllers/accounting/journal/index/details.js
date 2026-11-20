import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class AccountingJournalIndexDetailsController extends Controller {
    @service intl;
    @service notifications;
    @service modalsManager;
    @service hostRouter;

    @tracked overlay = null;

    get tabs() {
        return [{ label: this.intl.t('literal.ledger.overview'), route: 'accounting.journal.index.details.index' }];
    }

    get actionButtons() {
        const entry = this.model;
        if (entry?.is_system_entry) return [];
        return [{ label: this.intl.t('literal.ledger.delete'), icon: 'trash', type: 'danger', helpText: this.intl.t('literal.ledger.permanently-delete-this-journal-entry-system-ent-5f6d8'), onClick: this.deleteEntry }];
    }

    @action async deleteEntry() {
        const entry = this.model;
        this.modalsManager.confirm({
            title: this.intl.t('literal.ledger.delete-journal-entry'),
            body: this.intl.t('literal.ledger.this-action-cannot-be-undone'),
            confirm: async (modal) => {
                modal.startLoading();
                try {
                    await entry.destroyRecord();
                    this.notifications.success(this.intl.t('literal.ledger.journal-entry-deleted'));
                    this.hostRouter.transitionTo('accounting.journal.index');
                    modal.done();
                } catch (error) {
                    this.notifications.serverError(error);
                    modal.stopLoading();
                }
            },
        });
    }
}
