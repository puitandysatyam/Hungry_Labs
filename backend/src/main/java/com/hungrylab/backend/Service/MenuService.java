package com.hungrylab.backend.Service;


import com.hungrylab.backend.Entity.Addon;
import com.hungrylab.backend.Entity.MenuItem;
import com.hungrylab.backend.Repository.MenuRepository;
import com.hungrylab.backend.dto.AddOnDto;
import com.hungrylab.backend.dto.MenuItemResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MenuService {

    @Autowired
    MenuRepository menuRepository;

    public List<MenuItemResponseDto> getMenu(){

        List<MenuItemResponseDto> menuItemResponseDtoList = new ArrayList<>();
        List<MenuItem> menuItemList = menuRepository.findAll();

        for( MenuItem menuItem : menuItemList){

            List<AddOnDto> addOnDtoList = new ArrayList<>();
            // Fix: The array variable in MenuItem is called addonList, not addons
            if (menuItem.getAddonList() != null) {
                for(Addon addon : menuItem.getAddonList()){
                    addOnDtoList.add(new AddOnDto(addon.getId(), addon.getName(), addon.getPrice()));
                }
            }
            menuItemResponseDtoList.add(new MenuItemResponseDto(
                    menuItem.getId(),
                    menuItem.getCategory(),
                    menuItem.getName(),
                    menuItem.getDesc(),
                    menuItem.getPrice(),
                    menuItem.isVeg(),
                    menuItem.getImageUrl(),
                    addOnDtoList
            ));

        }

        return menuItemResponseDtoList;

    }
}
