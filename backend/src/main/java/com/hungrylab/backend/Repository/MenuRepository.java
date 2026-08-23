package com.hungrylab.backend.Repository;

import com.hungrylab.backend.Entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuRepository extends JpaRepository<MenuItem,Long> {


}
