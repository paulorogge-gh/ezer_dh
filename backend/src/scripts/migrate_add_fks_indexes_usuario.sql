ALTER TABLE usuario
  ADD INDEX idx_usuario_id_empresa (id_empresa),
  ADD INDEX idx_usuario_id_colaborador (id_colaborador);

ALTER TABLE usuario
  ADD CONSTRAINT fk_usuario_empresa FOREIGN KEY (id_empresa)
  REFERENCES empresa(id_empresa);

ALTER TABLE usuario
  ADD CONSTRAINT fk_usuario_colaborador FOREIGN KEY (id_colaborador)
  REFERENCES colaborador(id_colaborador);

