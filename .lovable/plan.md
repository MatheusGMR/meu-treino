

# Plano: Associar Vídeos do YouTube aos Exercícios

## Mapeamento Identificado

Com base nos exercícios encontrados no banco de dados, farei o seguinte mapeamento:

| Vídeo Fornecido | Exercício no Banco de Dados | ID |
|-----------------|----------------------------|-----|
| Cadeira Abdutora Hammer | **Cadeira Abdutora** | `f2501376-6b26-4bd0-a805-47eff395696d` |
| Cadeira Extensora Hammer | **Cadeira Extensora** (sem URL) | `95ab9234-b63a-46a5-8e77-c24bbee12d9f` |
| Puxada Frontal Nautilus | **Puxada Frontal** | `c444d9dc-b1d4-4d71-a28c-0c8de6344b86` |
| Stiff - Barra | **Stiff** (sem URL) | `3b1a4b34-03eb-43c0-b0ce-44c008cfc721` |
| Desenvolvimento Articulado Nautilus | **Desenvolvimento com Halteres** (mais próximo) | `ba0598d4-6911-4905-b05b-16620c54e0bc` |
| Supino Reto Articulado Nautilus | **Supino Reto com Barra** | `b56f321e-a57d-4526-8081-c49f987c09e9` |
| Supino Inclinado Articulado Nautilus | **Supino Inclinado com Barra** | `0df4f1b0-9392-4023-abf0-0fb6d1ab1f75` |
| Tríceps Testa com Halteres | **Tríceps Testa** (sem URL) | `2631dc24-3f46-4194-a32e-a150232a358f` |
| Stiff Máquina Guiada | **Stiff** (alternativo, criar novo ou usar existente) | N/A - exercício não existe |
| Stiff com Halteres | **Dumbbell Stiff Leg Deadlift** | `97692520-6529-4179-a7c9-feed81766de1` |
| Rosca Direta Alternada com Halteres | **Rosca Alternada com Halteres** | `04fefb64-183a-4081-a06f-a2bd7657797c` |
| Rosca Martelo Simultâneo com Halteres | **Rosca Martelo** | `77dee996-1f88-4f84-ac88-e0d5e000cfb6` |
| Rosca Martelo Corda na Polia | **Cable Hammer Curl** | `5da62a1e-6be6-49a2-adc0-35ca44afb50d` |
| Rosca Scott máquina | **Rosca Scott** | `04b04ce1-ee07-4a8a-b1ab-6277b8d895bd` |

## Vídeos sem correspondência clara

Os vídeos com data "1 de setembro de 2025" não têm nomes de exercícios identificáveis. Eles serão **ignorados** a menos que você forneça mais informações sobre quais exercícios representam.

---

## Implementação

### Método de execução

Executarei **14 comandos UPDATE** para associar os vídeos aos exercícios correspondentes na tabela `exercises`.

### SQL a ser executado

```sql
-- 1. Cadeira Abdutora
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/wnIDZoduz0g' WHERE id = 'f2501376-6b26-4bd0-a805-47eff395696d';

-- 2. Cadeira Extensora (sem URL atual)
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/kLcM4DnKj_0' WHERE id = '95ab9234-b63a-46a5-8e77-c24bbee12d9f';

-- 3. Puxada Frontal
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/4havAcUVmIk' WHERE id = 'c444d9dc-b1d4-4d71-a28c-0c8de6344b86';

-- 4. Stiff (sem URL atual)
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/h5OxyBT_rvI' WHERE id = '3b1a4b34-03eb-43c0-b0ce-44c008cfc721';

-- 5. Desenvolvimento com Halteres (para Desenvolvimento Articulado)
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/NknEUA0kf7k' WHERE id = 'ba0598d4-6911-4905-b05b-16620c54e0bc';

-- 6. Supino Reto com Barra (para Supino Reto Articulado)
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/eiEui2oiTmo' WHERE id = 'b56f321e-a57d-4526-8081-c49f987c09e9';

-- 7. Supino Inclinado com Barra (para Supino Inclinado Articulado)
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/QeRMZeipWwY' WHERE id = '0df4f1b0-9392-4023-abf0-0fb6d1ab1f75';

-- 8. Tríceps Testa (sem URL atual)
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/1FOB6qgCg9Y' WHERE id = '2631dc24-3f46-4194-a32e-a150232a358f';

-- 9. Dumbbell Stiff Leg Deadlift (para Stiff com Halteres)
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/ucSkDh3c1Lo' WHERE id = '97692520-6529-4179-a7c9-feed81766de1';

-- 10. Rosca Alternada com Halteres
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/VTD3ojaLRD4' WHERE id = '04fefb64-183a-4081-a06f-a2bd7657797c';

-- 11. Rosca Martelo
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/IgwKuLwRj9k' WHERE id = '77dee996-1f88-4f84-ac88-e0d5e000cfb6';

-- 12. Cable Hammer Curl (para Rosca Martelo Corda na Polia)
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/XVrZ4QvVFQc' WHERE id = '5da62a1e-6be6-49a2-adc0-35ca44afb50d';

-- 13. Rosca Scott
UPDATE exercises SET video_url = 'https://www.youtube.com/shorts/HVYszfIXLjU' WHERE id = '04b04ce1-ee07-4a8a-b1ab-6277b8d895bd';
```

---

## Exercícios não encontrados

- **Stiff Máquina Guiada**: Não existe no banco. Posso **criar** este exercício com o vídeo ou você pode indicar qual exercício existente deve receber este vídeo.

## Resumo

| Status | Quantidade |
|--------|------------|
| Vídeos a associar | **13** |
| Vídeos ignorados (sem nome) | **6** |
| Exercício não encontrado | **1** (Stiff Máquina Guiada) |

