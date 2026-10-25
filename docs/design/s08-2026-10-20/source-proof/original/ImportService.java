import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

interface ImportRepository {
    boolean insertIfAbsent(String key, String value);
}

@Component
class ImportService {
    private final ImportRepository repository;
    private final TransactionTemplate transactions;

    ImportService(ImportRepository repository,
                  PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    boolean importOne(String key, String value) {
        return Boolean.TRUE.equals(transactions.execute(status -> {
            boolean inserted = repository.insertIfAbsent(key, value);
            if (!inserted) {
                status.setRollbackOnly();
            }
            return inserted;
        }));
    }
}
