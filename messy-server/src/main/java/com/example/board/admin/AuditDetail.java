package com.example.board.admin;

/** @Audited 메서드의 반환값이 구현하면 성공 기록의 detail 뒤에 붙는다. */
public interface AuditDetail {

    String auditDetail();
}
