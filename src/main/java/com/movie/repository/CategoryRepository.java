package com.movie.repository;

import com.movie.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByName(String name);
    
    /**
     * 查询所有分类，按ID升序排序
     */
    @Query("SELECT c FROM Category c ORDER BY c.id ASC")
    List<Category> findAllOrderBySortOrderAndCreateTime();
}














