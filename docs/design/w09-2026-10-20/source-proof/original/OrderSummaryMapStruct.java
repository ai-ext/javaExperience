// OrderSummaryMapStruct.java
package example.order;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderSummaryMapStruct {
    @Mapping(target = "customerName", source = "customer.name")
    OrderSummary toSummary(OrderEntity order);
}
