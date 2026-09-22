package com.jayarathna.powertools.repository;

import com.jayarathna.powertools.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer>, JpaSpecificationExecutor<Order> {

    List<Order> findTop10ByOrderByOrderIdDesc();

    List<Order> findByUserUserIdOrderByOrderIdDesc(Integer userId);
}