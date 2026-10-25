package example.order;

import java.math.BigDecimal;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    comments = "version: 1.6.3, compiler: IncrementalProcessingEnvironment from gradle-java-compiler-worker-9.8.0.jar, environment: Java 21.0.6 (Amazon.com Inc.)"
)
@Component
public class OrderSummaryMapStructImpl implements OrderSummaryMapStruct {

    @Override
    public OrderSummary toSummary(OrderEntity order) {
        if ( order == null ) {
            return null;
        }

        String customerName = null;
        Long id = null;
        String status = null;
        BigDecimal total = null;

        customerName = orderCustomerName( order );
        id = order.getId();
        status = order.getStatus();
        total = order.getTotal();

        OrderSummary orderSummary = new OrderSummary( id, status, customerName, total );

        return orderSummary;
    }

    private String orderCustomerName(OrderEntity orderEntity) {
        CustomerEntity customer = orderEntity.getCustomer();
        if ( customer == null ) {
            return null;
        }
        return customer.getName();
    }
}
