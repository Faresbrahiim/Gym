package com.gym.db_spring;

import com.gym.db_spring.model.User;
import com.gym.db_spring.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DbSpringApplication {

    public static void main(String[] args) {
        SpringApplication.run(DbSpringApplication.class, args);
    }
    @Bean
    CommandLineRunner runner(UserRepository userRepository) {
        return args -> {
            userRepository.save(new User("Ibrahim", "ibrahim@mail.com"));
            userRepository.save(new User("Alice", "alice@mail.com"));

            userRepository.findAll().forEach(u ->
                    System.out.println(u.getId() + " - " + u.getName() + " - " + u.getEmail())
            );
        };
    }


}
