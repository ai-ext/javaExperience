package example.deploy;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

// 실제 앱/router와 별도인 새 in-memory H2 수동 이관 예시다.
public class SchemaProof {
    static String name(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement(); ResultSet rows = statement.executeQuery("SELECT full_name FROM people WHERE id=1")) {
            rows.next(); return rows.getString(1);
        }
    }
    public static void main(String[] args) throws Exception {
        try (Connection connection = DriverManager.getConnection("jdbc:h2:mem:d06;DB_CLOSE_DELAY=0")) {
            System.out.println("AUTOCOMMIT=" + connection.getAutoCommit());
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE TABLE people(id BIGINT PRIMARY KEY, full_name VARCHAR(100))");
                try (PreparedStatement insert = connection.prepareStatement("INSERT INTO people(id,full_name) VALUES(1,?)")) {
                    insert.setString(1, "Ada  Lovelace"); insert.executeUpdate();
                }
                String original = name(connection);
                System.out.println("BASE_OLD=" + original);
                System.out.println("BASE_LENGTH=" + original.length());
                statement.execute("ALTER TABLE people ADD given_name VARCHAR(100)");
                statement.execute("ALTER TABLE people ADD family_name VARCHAR(100)");
                System.out.println("EXPAND_OLD=" + name(connection));
                statement.executeUpdate("UPDATE people SET given_name='Ada', family_name='Lovelace' WHERE id=1");
                try (ResultSet rows = statement.executeQuery("SELECT given_name,family_name FROM people WHERE id=1")) {
                    rows.next(); System.out.println("BACKFILL_NEW=" + rows.getString(1) + "|" + rows.getString(2));
                }
                System.out.println("BACKFILL_OLD=" + name(connection));
                statement.execute("ALTER TABLE people DROP COLUMN full_name");
                try { name(connection); throw new AssertionError("old query unexpectedly succeeded"); }
                catch (SQLException missing) { System.out.println("CONTRACT_OLD_SQLSTATE=" + missing.getSQLState()); }
                statement.execute("ALTER TABLE people ADD full_name VARCHAR(100)");
                statement.executeUpdate("UPDATE people SET full_name=given_name || ' ' || family_name WHERE id=1");
                String restored = name(connection);
                System.out.println("DOWN_RECREATED=" + restored);
                System.out.println("DOWN_LENGTH=" + restored.length());
                System.out.println("ORIGINAL_BYTES_RESTORED=" + original.equals(restored));
                System.out.println("ROW_COUNT=" + count(connection));
            }
        }
        System.out.println("OWN_MEMORY_CONNECTION_CLOSED=true");
    }
    static int count(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement(); ResultSet rows = statement.executeQuery("SELECT COUNT(*) FROM people")) {
            rows.next(); return rows.getInt(1);
        }
    }
}
