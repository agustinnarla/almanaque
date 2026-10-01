# Plan — Spec 045
1. `data_cleaner.read_all_sheets`: `pd.read_excel(sheet_name=None)`, descarta hojas vacías y concatena. Lo usan `load_and_clean` y `main._read_dates`.
2. `main._drop_repeated_calls`: por `(campaña, fecha)`, descarta IDs repetidos de `Id. llamada` y avisa.
3. Tests en `test_pipeline_multi_file.py` (multi-hoja, copias de hojas, sin ID).
4. Validación real: recarga de los 21 `.xls` multi-hoja; 92 22/09 con `.xls` + «Hoja N» igual al `.xls` solo.
5. `/cerrar-spec 045`, commit + push.
