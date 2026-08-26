package com.hungrylab.backend.Controller;



import com.hungrylab.backend.Service.MenuService;
import com.hungrylab.backend.dto.MenuItemResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    @Autowired
    MenuService menuService;

    @GetMapping("/")
    public ResponseEntity<List<MenuItemResponseDto>> getMenu(){

        List<MenuItemResponseDto> menuItems = menuService.getMenu();
        return ResponseEntity.ok(menuItems);
    }

}
