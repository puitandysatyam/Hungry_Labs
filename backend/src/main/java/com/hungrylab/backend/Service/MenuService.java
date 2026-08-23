package com.hungrylab.backend.Service;


import com.hungrylab.backend.dto.MenuItemResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuService {

    @Autowired
    MenuRepository menuRepository;

    public List<MenuItemResponseDto> getMenu(){


    }
}
