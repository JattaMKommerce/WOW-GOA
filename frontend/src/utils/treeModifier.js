// ─── TREE MUTATION UTILS ──────────────────────────────────────────────────────
// Helper functions for updating the deeply nested component architecture.
// Each node has { id, type, label, props, style, children, visible, locked }

export function generateId(type) {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

// Traverse the tree to find a specific node
export function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Find a node's parent array and its index
export function findNodePath(nodes, id) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.id === id) {
      return { parentArray: nodes, index: i, node };
    }
    if (node.children) {
      const found = findNodePath(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Add a node at a specific path
// targetId: ID of the container to add inside, OR ID of a sibling to insert before/after
// position: 'inside', 'before', 'after'
export function addNodeToTree(nodes, newNode, targetId = null, position = 'inside') {
  const newTree = JSON.parse(JSON.stringify(nodes)); // Deep clone
  
  if (!targetId) {
    newTree.push(newNode);
    return newTree;
  }

  const path = findNodePath(newTree, targetId);
  if (!path) {
    // Fallback: push to root if target not found
    newTree.push(newNode);
    return newTree;
  }

  if (position === 'inside') {
    if (!path.node.children) path.node.children = [];
    path.node.children.push(newNode);
  } else if (position === 'before') {
    path.parentArray.splice(path.index, 0, newNode);
  } else if (position === 'after') {
    path.parentArray.splice(path.index + 1, 0, newNode);
  }

  return newTree;
}

// Update a specific node in the tree
export function updateNodeInTree(nodes, id, updater) {
  return nodes.map(node => {
    if (node.id === id) {
      return { ...node, ...updater(node) };
    }
    if (node.children) {
      return { ...node, children: updateNodeInTree(node.children, id, updater) };
    }
    return node;
  });
}

// Remove a specific node from the tree
export function removeNodeFromTree(nodes, id) {
  return nodes.filter(node => {
    if (node.id === id) return false;
    if (node.children) {
      node.children = removeNodeFromTree(node.children, id);
    }
    return true;
  });
}

// Move a node within the tree
export function moveNodeInTree(nodes, sourceId, targetId, position = 'inside') {
  const originalPath = findNodePath(nodes, sourceId);
  if (!originalPath) return nodes;

  const nodeToMove = JSON.parse(JSON.stringify(originalPath.node));
  
  // First remove it
  let nextTree = removeNodeFromTree(nodes, sourceId);
  
  // Then insert it
  return addNodeToTree(nextTree, nodeToMove, targetId, position);
}
