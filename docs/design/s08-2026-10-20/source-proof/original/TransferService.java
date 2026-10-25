import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

interface TransferRepository {
    void debit(long accountId, long cents) throws InsufficientFundsException;
    void credit(long accountId, long cents);
}

final class InsufficientFundsException extends Exception { }

@Service
class TransferService {
    private final TransferRepository repository;

    TransferService(TransferRepository repository) {
        this.repository = repository;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, timeout = 3,
                   rollbackFor = InsufficientFundsException.class)
    public void transfer(long from, long to, long cents)
            throws InsufficientFundsException {
        repository.debit(from, cents);
        repository.credit(to, cents);
    }
}
