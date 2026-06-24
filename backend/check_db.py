import sqlite3

try:
    # Connect to the SQLite fallback database
    conn = sqlite3.connect('vaizai_support.db')
    cur = conn.cursor()
    
    # Fetch all table names
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cur.fetchall() if not r[0].startswith('sqlite_')]
    
    print("\n==========================================")
    print("      VAIZAI SQLITE DATABASE STATUS")
    print("==========================================")
    
    print("\n--- Tables & Record Counts ---")
    for table in tables:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]
        print(f" * {table:20} : {count} records")
        
    # Print sample tickets if table exists
    if 'tickets' in tables:
        print("\n--- Sample Support Tickets ---")
        cur.execute("SELECT id, title, priority, status FROM tickets LIMIT 5")
        rows = cur.fetchall()
        if not rows:
            print(" No tickets found.")
        for row in rows:
            print(f" [{row[0]}] {row[1]:30} | Priority: {row[2]:6} | Status: {row[3]}")
            
    # Print sample Knowledge Base articles
    if 'knowledge_articles' in tables:
        print("\n--- Sample KB Articles ---")
        cur.execute("SELECT id, title, category FROM knowledge_articles LIMIT 5")
        rows = cur.fetchall()
        if not rows:
            print(" No KB articles found.")
        for row in rows:
            print(f" [{row[0]}] {row[1]:35} | Category: {row[2]}")
            
    print("==========================================\n")
    conn.close()

except Exception as e:
    print(f"Error checking database: {e}")
