package com.hungrylab.backend.Repository;

import com.hungrylab.backend.Entity.Addon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddonRepository extends JpaRepository<Addon, Long> {
    List<Addon> findByIdIn(List<Long> ids);
}