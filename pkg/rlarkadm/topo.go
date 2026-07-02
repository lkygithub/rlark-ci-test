package rlarkadm

import (
	"fmt"
	"strings"
)

// topologicalSort returns components in deployment order (dependencies first).
// Uses Kahn's algorithm. Returns error on cyclic dependencies.
func topologicalSort(comps []Component) ([]Component, error) {
	compMap := make(map[string]*Component, len(comps))
	for i := range comps {
		compMap[comps[i].Name] = &comps[i]
	}

	inDegree := make(map[string]int, len(comps))
	dependents := make(map[string][]string)
	for _, c := range comps {
		inDegree[c.Name] = len(c.Dependencies)
		for _, dep := range c.Dependencies {
			if _, ok := compMap[dep]; ok {
				dependents[dep] = append(dependents[dep], c.Name)
			} else {
				inDegree[c.Name]--
			}
		}
	}

	var queue []string
	for _, c := range comps {
		if inDegree[c.Name] == 0 {
			queue = append(queue, c.Name)
		}
	}

	var sorted []Component
	for len(queue) > 0 {
		name := queue[0]
		queue = queue[1:]
		sorted = append(sorted, *compMap[name])

		for _, dependent := range dependents[name] {
			inDegree[dependent]--
			if inDegree[dependent] == 0 {
				queue = append(queue, dependent)
			}
		}
	}

	if len(sorted) != len(comps) {
		var cyclic []string
		for _, c := range comps {
			if inDegree[c.Name] > 0 {
				cyclic = append(cyclic, c.Name)
			}
		}
		return nil, fmt.Errorf("cyclic dependency detected among: %s", strings.Join(cyclic, ", "))
	}

	return sorted, nil
}
