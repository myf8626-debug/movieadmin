package com.movie.interceptor;

import com.movie.entity.User;
import com.movie.repository.UserRepository;
import com.movie.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Optional;

@Component
public class JwtInterceptor implements HandlerInterceptor {
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            if (jwtUtil.validateToken(token)) {
                try {
                    String username = jwtUtil.getUsernameFromToken(token);
                    request.setAttribute("username", username);
                    
                    // 获取用户角色信息并添加到request中
                    Optional<User> userOpt = userRepository.findByUsername(username);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        request.setAttribute("userRole", user.getRole());
                    }
                    
                    // 调试：打印用户信息
                    System.out.println("JWT拦截器: 解析token成功, username=" + username);
                } catch (Exception e) {
                    System.err.println("JWT拦截器: 解析token失败: " + e.getMessage());
                }
            } else {
                System.out.println("JWT拦截器: token无效");
            }
        } else {
            System.out.println("JWT拦截器: 未找到token, URL=" + request.getRequestURI());
        }
        
        // 对于被排除的接口（如/movies/list），即使没有token也允许访问
        // 但如果有有效的token，username已经被设置到request中
        // 对于需要认证的接口，如果没有token或token无效，会在后续的权限检查中处理
        return true;
    }
}














